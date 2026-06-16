'use server'

// src/actions/order.ts
// ============================================
// ORDER SERVER ACTIONS
// ============================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
// COMPLETE ORDER — Stripe capture + DB update
//
// Calls the /api/orders/[id]/release endpoint which:
//   1. Calls stripe.paymentIntents.capture()  ← money moves
//   2. Updates order status to 'completed'
// ─────────────────────────────────────────────────────────────────
export async function actionCompleteOrder(orderId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    try {
        // Call the release API route — it handles both Stripe capture + DB update
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/orders/${orderId}/release`,
            {
                method: 'POST',
                headers: {
                    // Forward the cookie so the API can verify the user session
                    Cookie: (await import('next/headers')).cookies().toString(),
                },
            }
        )

        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Release failed')

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
        // Fetch the stripe_payment_intent_id before cancelling
        const { data: order } = await supabase
            .from('orders')
            .select('stripe_payment_intent_id, status')
            .eq('id', orderId)
            .single()

        await cancelOrder(orderId, userId)

        // If there's an active Stripe PaymentIntent, cancel it to release the hold
        if (order?.stripe_payment_intent_id && ['pending', 'paid'].includes(order.status ?? '')) {
            try {
                const { stripe } = await import('@/lib/stripe')
                await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
            } catch (stripeErr) {
                console.error('[actionCancelOrder] Stripe cancel failed:', stripeErr)
                // DB is already updated — log and continue
            }
        }

        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel order' }
    }
}

// ─────────────────────────────────────────────────────────────────
// REFUND (admin only) — handled via /api/orders/[id]/refund
// ─────────────────────────────────────────────────────────────────
export async function actionRefundOrder(orderId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/orders/${orderId}/refund`,
            {
                method: 'POST',
                headers: {
                    Cookie: (await import('next/headers')).cookies().toString(),
                },
            }
        )

        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Refund failed')

        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to process refund' }
    }
}