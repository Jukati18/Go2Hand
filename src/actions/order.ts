'use server'

// src/actions/order.ts
// ============================================
// ORDER SERVER ACTIONS
// ============================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import {
    createOrder,
    markOrderShipped,
    markOrderReceived,
    completeOrder,
    disputeOrder,
    cancelOrder,
    refundOrder,
} from '@/services/orderWriteService'
import type { CreateOrderInput } from '@/types/order'

type ActionResult = { success: boolean; error?: string; orderId?: string }

async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}

function revalidateOrderPages(orderId: string) {
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/listings')
}

// ─────────────────────────────────────────────────────────────────
// CREATE ORDER (used for non-Stripe / test flows)
// The primary Stripe checkout flow creates orders via /api/checkout.
// ─────────────────────────────────────────────────────────────────
export async function actionCreateOrder(input: CreateOrderInput): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in to place an order' }

    if (userId === input.sellerId) {
        return { success: false, error: 'You cannot purchase your own listing' }
    }

    try {
        const { id } = await createOrder(userId, input)
        revalidatePath('/devices')
        revalidatePath(`/devices/${input.productId}`)
        revalidatePath('/dashboard/orders')
        return { success: true, orderId: id }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to create order' }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK AS SHIPPED (seller)
// ─────────────────────────────────────────────────────────────────
export async function actionMarkShipped(
    orderId: string,
    trackingNumber: string,
    shippingProvider: string
): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }
    if (!trackingNumber.trim()) return { success: false, error: 'Tracking number is required' }

    try {
        await markOrderShipped(orderId, userId, trackingNumber, shippingProvider)
        revalidateOrderPages(orderId)
        return { success: true }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to update shipment' }
    }
}

// ─────────────────────────────────────────────────────────────────
// MARK AS RECEIVED (buyer)
// ─────────────────────────────────────────────────────────────────
export async function actionMarkReceived(orderId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    try {
        await markOrderReceived(orderId, userId)
        revalidateOrderPages(orderId)
        return { success: true }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to mark as received' }
    }
}

// ─────────────────────────────────────────────────────────────────
// COMPLETE ORDER — buyer approves, Stripe capture + DB update
//
// FIXED: previously this called fetch('/api/orders/[id]/release')
// and tried to forward the session with
// `(await import('next/headers')).cookies().toString()`.
// `cookies()` is async here, so calling it without `await` returns
// an un-resolved value with no `.toString()` — that's the exact
// "(intermediate value).cookies(...).toString is not a function"
// error. Instead of patching that and keeping the internal HTTP
// hop, this now does the Stripe capture + DB update directly,
// using the request's own Supabase session — same logic the API
// route had, just inline.
// ─────────────────────────────────────────────────────────────────
export async function actionCompleteOrder(orderId: string): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'You must be logged in' }

    try {
        const { data: order, error: fetchErr } = await supabase
            .from('orders')
            .select('id, buyer_id, status, stripe_payment_intent_id')
            .eq('id', orderId)
            .single()

        if (fetchErr || !order) {
            return { success: false, error: 'Order not found' }
        }
        if (order.buyer_id !== user.id) {
            return { success: false, error: 'Forbidden' }
        }
        if (order.status !== 'in_inspection') {
            return {
                success: false,
                error: `Cannot release payment — order status is '${order.status}'`,
            }
        }

        // Capture the Stripe PaymentIntent — this is the moment money
        // actually moves from the buyer's held authorization to
        // Go2Hand's Stripe balance.
        if (order.stripe_payment_intent_id) {
            await stripe.paymentIntents.capture(order.stripe_payment_intent_id)
        } else {
            console.warn('[actionCompleteOrder] No stripe_payment_intent_id on order', orderId)
        }

        await completeOrder(orderId, user.id)

        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to complete order' }
    }
}

// ─────────────────────────────────────────────────────────────────
// DISPUTE ORDER (buyer)
// ─────────────────────────────────────────────────────────────────
export async function actionDisputeOrder(orderId: string, reason: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }
    if (!reason.trim() || reason.trim().length < 10) {
        return { success: false, error: 'Please describe the issue in at least 10 characters' }
    }

    try {
        await disputeOrder(orderId, userId, reason)
        revalidateOrderPages(orderId)
        return { success: true }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to open dispute' }
    }
}

// ─────────────────────────────────────────────────────────────────
// CANCEL ORDER (buyer — before shipping)
// Also cancels the Stripe hold via the DB cancel flow.
// ─────────────────────────────────────────────────────────────────
export async function actionCancelOrder(orderId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    try {
        const supabase = await createClient()
        const { data: order } = await supabase
            .from('orders')
            .select('stripe_payment_intent_id, status')
            .eq('id', orderId)
            .single()

        await cancelOrder(orderId, userId)

        if (order?.stripe_payment_intent_id && ['pending', 'paid'].includes(order.status ?? '')) {
            try {
                await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
            } catch (stripeErr) {
                console.error('[actionCancelOrder] Stripe cancel failed:', stripeErr)
            }
        }

        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel order' }
    }
}

// ─────────────────────────────────────────────────────────────────
// REFUND (admin only)
//
// FIXED: same root cause as actionCompleteOrder above. Moved the
// release-the-hold / issue-refund logic in-line so there's no
// internal fetch and no cookie-forwarding involved.
// ─────────────────────────────────────────────────────────────────
export async function actionRefundOrder(orderId: string): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'You must be logged in' }

    try {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return { success: false, error: 'Admin access required' }
        }

        const { data: order, error: fetchErr } = await supabase
            .from('orders')
            .select('id, status, stripe_payment_intent_id, product_id')
            .eq('id', orderId)
            .single()

        if (fetchErr || !order) {
            return { success: false, error: 'Order not found' }
        }
        if (order.status !== 'disputed') {
            return { success: false, error: `Cannot refund — order status is '${order.status}'` }
        }

        if (order.stripe_payment_intent_id) {
            try {
                const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)

                if (pi.status === 'requires_capture') {
                    await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
                } else if (pi.status === 'succeeded') {
                    await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id })
                } else {
                    console.warn('[actionRefundOrder] PaymentIntent in unexpected status:', pi.status)
                }
            } catch (stripeErr) {
                console.error('[actionRefundOrder] Stripe error:', stripeErr)
            }
        }

        await refundOrder(orderId)

        await supabase
            .from('products')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', order.product_id)

        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to process refund' }
    }
}