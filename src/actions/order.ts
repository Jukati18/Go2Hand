'use server'

// ============================================
// ORDER SERVER ACTIONS
//
// These run on the server (Next.js Server Actions).
// Every action: 1) checks auth, 2) validates input,
// 3) calls the write service, 4) revalidates cache.
//
// Usage in a client component:
//   const result = await actionMarkShipped(orderId, trackingNum, provider)
//   if (!result.success) showError(result.error)
// ============================================

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
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

// ── Standard result shape for all actions ────────────────────────
type ActionResult = { success: boolean; error?: string; orderId?: string }

// ── Get current authenticated user ID ────────────────────────────
async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}

// ── Revalidate all pages that show order data ─────────────────────
function revalidateOrderPages(orderId: string) {
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/listings')
}

// ─────────────────────────────────────────────────────────────────
// ACTION: CREATE ORDER
// Called from the checkout page after Stripe payment succeeds.
// ─────────────────────────────────────────────────────────────────
export async function actionCreateOrder(
    input: CreateOrderInput
): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in to place an order' }
    }

    // Prevent a seller from buying their own listing
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
        const message = err instanceof Error ? err.message : 'Failed to create order'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: MARK AS SHIPPED (seller)
// ─────────────────────────────────────────────────────────────────
export async function actionMarkShipped(
    orderId: string,
    trackingNumber: string,
    shippingProvider: string
): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    if (!trackingNumber.trim()) {
        return { success: false, error: 'Tracking number is required' }
    }

    try {
        await markOrderShipped(orderId, userId, trackingNumber, shippingProvider)
        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update shipment'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: MARK AS RECEIVED (buyer — starts inspection window)
// ─────────────────────────────────────────────────────────────────
export async function actionMarkReceived(orderId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    try {
        await markOrderReceived(orderId, userId)
        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark as received'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: COMPLETE ORDER (buyer approves — releases escrow)
// ─────────────────────────────────────────────────────────────────
export async function actionCompleteOrder(orderId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    try {
        await completeOrder(orderId, userId)
        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to complete order'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: DISPUTE ORDER (buyer raises issue)
// ─────────────────────────────────────────────────────────────────
export async function actionDisputeOrder(
    orderId: string,
    reason: string
): Promise<ActionResult> {
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
        const message = err instanceof Error ? err.message : 'Failed to open dispute'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: CANCEL ORDER (buyer)
// ─────────────────────────────────────────────────────────────────
export async function actionCancelOrder(orderId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    try {
        await cancelOrder(orderId, userId)
        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel order'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: REFUND (admin only)
// ─────────────────────────────────────────────────────────────────
export async function actionRefundOrder(orderId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'You must be logged in' }

    // TODO: verify this user has admin role from users table before proceeding
    // const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single()
    // if (profile?.role !== 'admin') return { success: false, error: 'Unauthorized' }

    try {
        await refundOrder(orderId)
        revalidateOrderPages(orderId)
        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process refund'
        return { success: false, error: message }
    }
}