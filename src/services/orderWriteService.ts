// ============================================
// ORDER WRITE SERVICE — create & status updates
//
// All functions here mutate the orders table.
// Each status transition updates ONLY the
// timestamp column for that specific transition,
// never touching other history columns.
// ============================================

import { supabase } from '@/lib/supabaseClient'
import type { CreateOrderInput, OrderStatus } from '@/types/order'

// ── Platform fee rate (5% taken from seller payout) ──────────────
const PLATFORM_FEE_RATE = 0.05

// ─────────────────────────────────────────────────────────────────
// CREATE ORDER
// Called at checkout after payment is confirmed.
// The order starts as 'paid' because we only create it once
// the Stripe payment intent succeeds (money is in escrow).
// ─────────────────────────────────────────────────────────────────
export async function createOrder(
    buyerId: string,
    input: CreateOrderInput
): Promise<{ id: string }> {
    if (!input.productId || !input.sellerId) {
        throw new Error('productId and sellerId are required')
    }
    if (input.amount <= 0) {
        throw new Error('Order amount must be greater than 0')
    }

    const total = input.amount + (input.shippingFee ?? 0)
    const platformFee = Math.round(input.amount * PLATFORM_FEE_RATE * 100) / 100

    const now = new Date().toISOString()

    const { data, error } = await supabase
        .from('orders')
        .insert({
            buyer_id: buyerId,
            seller_id: input.sellerId,
            product_id: input.productId,

            amount: input.amount,
            shipping_fee: input.shippingFee ?? 0,
            platform_fee: platformFee,
            total,

            // Start as 'paid' because payment already confirmed via Stripe webhook.
            // If you create the order BEFORE payment, start as 'pending' instead.
            status: 'paid' as OrderStatus,
            paid_at: now,

            shipping_address: input.shippingAddress,
            stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
        })
        .select('id')
        .single()

    if (error) throw new Error(`Failed to create order: ${error.message}`)

    // Mark the product as sold so it disappears from listings
    await supabase
        .from('products')
        .update({ status: 'sold', updated_at: now })
        .eq('id', input.productId)

    return { id: data.id }
}

// ─────────────────────────────────────────────────────────────────
// MARK AS SHIPPED
// Called by the seller after they drop the package off.
// Requires a tracking number.
// ─────────────────────────────────────────────────────────────────
export async function markOrderShipped(
    orderId: string,
    sellerId: string,
    trackingNumber: string,
    shippingProvider: string
): Promise<void> {
    if (!trackingNumber.trim()) {
        throw new Error('Tracking number is required')
    }

    const { error } = await supabase
        .from('orders')
        .update({
            status: 'shipped',
            shipped_at: new Date().toISOString(),
            tracking_number: trackingNumber.trim(),
            shipping_provider: shippingProvider.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('seller_id', sellerId)       // RLS: only the seller can do this
        .eq('status', 'paid')            // Can only ship a paid order

    if (error) throw new Error(`Failed to mark order as shipped: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────
// MARK AS RECEIVED (starts inspection window)
// Called by buyer when the package arrives.
// After this, the buyer has 5 days to approve or dispute.
// ─────────────────────────────────────────────────────────────────
export async function markOrderReceived(
    orderId: string,
    buyerId: string
): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'in_inspection',
            inspection_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('buyer_id', buyerId)         // Only the buyer can do this
        .eq('status', 'shipped')         // Only possible after shipping

    if (error) throw new Error(`Failed to mark order as received: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────
// COMPLETE ORDER (buyer approves → releases escrow to seller)
// This is the happy path ending.
// In production: also trigger Stripe transfer to seller's account.
// ─────────────────────────────────────────────────────────────────
export async function completeOrder(
    orderId: string,
    buyerId: string
): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('buyer_id', buyerId)
        .eq('status', 'in_inspection')

    if (error) throw new Error(`Failed to complete order: ${error.message}`)

    // TODO in production: call Stripe to transfer funds from escrow to seller
    // await stripe.transfers.create({ amount: order.amount - platformFee, ... })
}

// ─────────────────────────────────────────────────────────────────
// DISPUTE ORDER (buyer raises issue during inspection)
// ─────────────────────────────────────────────────────────────────
export async function disputeOrder(
    orderId: string,
    buyerId: string,
    reason: string
): Promise<void> {
    if (!reason.trim()) {
        throw new Error('A reason is required to open a dispute')
    }

    const { error } = await supabase
        .from('orders')
        .update({
            status: 'disputed',
            disputed_at: new Date().toISOString(),
            dispute_reason: reason.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('buyer_id', buyerId)
        .eq('status', 'in_inspection')

    if (error) throw new Error(`Failed to open dispute: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────
// CANCEL ORDER (buyer cancels before it ships)
// ─────────────────────────────────────────────────────────────────
export async function cancelOrder(
    orderId: string,
    buyerId: string
): Promise<void> {
    // Can only cancel while pending or paid (not yet shipped)
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status, product_id')
        .eq('id', orderId)
        .eq('buyer_id', buyerId)
        .single()

    if (fetchError || !order) throw new Error('Order not found')

    if (!['pending', 'paid'].includes(order.status)) {
        throw new Error('Cannot cancel an order that has already been shipped')
    }

    const now = new Date().toISOString()

    const { error } = await supabase
        .from('orders')
        .update({
            status: 'cancelled',
            cancelled_at: now,
            updated_at: now,
        })
        .eq('id', orderId)

    if (error) throw new Error(`Failed to cancel order: ${error.message}`)

    // Re-activate the product listing (it was marked sold at purchase)
    await supabase
        .from('products')
        .update({ status: 'active', updated_at: now })
        .eq('id', order.product_id)

    // TODO in production: trigger Stripe refund if status was 'paid'
}

// ─────────────────────────────────────────────────────────────────
// REFUND ORDER (admin resolves dispute in buyer's favor)
// ─────────────────────────────────────────────────────────────────
export async function refundOrder(orderId: string): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('status', 'disputed')        // Only possible from disputed state

    if (error) throw new Error(`Failed to refund order: ${error.message}`)

    // TODO in production: trigger Stripe refund
    // await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId })
}