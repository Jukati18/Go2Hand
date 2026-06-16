// src/services/orderWriteService.ts
// ============================================
// ORDER WRITE SERVICE — create & status updates
// ============================================

import { supabaseAdmin as supabase } from '@/lib/supabase/admin'
import type { CreateOrderInput, OrderStatus } from '@/types/order'

const PLATFORM_FEE_RATE = 0.05

// ─────────────────────────────────────────────────────────────────
// CREATE ORDER
//
// Called from /api/checkout BEFORE Stripe payment is confirmed.
// initialStatus defaults to 'paid' for backward compat, but the
// Stripe flow passes 'pending' — the webhook then upgrades it.
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

    // Determine initial status — 'pending' when created before Stripe confirms.
    const status: OrderStatus = input.initialStatus ?? 'paid'
    const paidAt = status === 'paid' ? now : null

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

            status,
            paid_at: paidAt,

            shipping_address: input.shippingAddress,
            stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
        })
        .select('id')
        .single()

    if (error) throw new Error(`Failed to create order: ${error.message}`)

    // Only mark product sold when payment is already confirmed.
    // For 'pending' orders we wait for the Stripe webhook.
    if (status === 'paid') {
        await supabase
            .from('products')
            .update({ status: 'sold', updated_at: now })
            .eq('id', input.productId)
    }

    return { id: data.id }
}

// ─────────────────────────────────────────────────────────────────
// CONFIRM PAYMENT (called by Stripe webhook only)
// Upgrades a 'pending' order to 'paid' after Stripe confirms.
// ─────────────────────────────────────────────────────────────────
export async function confirmOrderPayment(
    stripePaymentIntentId: string
): Promise<void> {
    const now = new Date().toISOString()

    // Find the order by Stripe PaymentIntent ID
    const { data: order, error: fetchErr } = await supabase
        .from('orders')
        .select('id, product_id, status')
        .eq('stripe_payment_intent_id', stripePaymentIntentId)
        .single()

    if (fetchErr || !order) {
        // Order not found — may have been created directly as 'paid' (non-Stripe flow)
        console.warn('confirmOrderPayment: order not found for PI', stripePaymentIntentId)
        return
    }

    if (order.status !== 'pending') return // Already updated — idempotent

    const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', paid_at: now, updated_at: now })
        .eq('id', order.id)

    if (error) throw new Error(`Failed to confirm payment: ${error.message}`)

    // Now mark product as sold (was held back until payment confirmed)
    await supabase
        .from('products')
        .update({ status: 'sold', updated_at: now })
        .eq('id', order.product_id)
}

// ─────────────────────────────────────────────────────────────────
// MARK AS SHIPPED
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
        .eq('seller_id', sellerId)
        .eq('status', 'paid')

    if (error) throw new Error(`Failed to mark order as shipped: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────
// MARK AS RECEIVED (starts inspection window)
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
        .eq('buyer_id', buyerId)
        .eq('status', 'shipped')

    if (error) throw new Error(`Failed to mark order as received: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────
// COMPLETE ORDER (DB only — Stripe capture is done in server action)
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
}

// ─────────────────────────────────────────────────────────────────
// DISPUTE ORDER
// ─────────────────────────────────────────────────────────────────
export async function disputeOrder(
    orderId: string,
    buyerId: string,
    reason: string
): Promise<void> {
    if (!reason.trim()) throw new Error('A reason is required to open a dispute')

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
// CANCEL ORDER (buyer cancels before shipping)
// ─────────────────────────────────────────────────────────────────
export async function cancelOrder(
    orderId: string,
    buyerId: string
): Promise<void> {
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
        .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
        .eq('id', orderId)

    if (error) throw new Error(`Failed to cancel order: ${error.message}`)

    // Re-activate the product listing
    await supabase
        .from('products')
        .update({ status: 'active', updated_at: now })
        .eq('id', order.product_id)
}

// ─────────────────────────────────────────────────────────────────
// REFUND ORDER (DB only — Stripe cancel is done in server action)
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
        .eq('status', 'disputed')

    if (error) throw new Error(`Failed to refund order: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────
// MARK AS SOLD (called when order is confirmed)
// ─────────────────────────────────────────────────────────────────
export async function markDeviceAsSold(deviceId: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({ status: 'sold', updated_at: new Date().toISOString() })
        .eq('id', deviceId)

    if (error) throw new Error(`Failed to mark device as sold: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────
// GET SELLER DEVICES
// ─────────────────────────────────────────────────────────────────
export async function getSellerDevices(sellerId: string) {
    const { data, error } = await supabase
        .from('products')
        .select(`
            id, title, price, original_price, condition, status,
            images, storage_capacity, color, battery_health,
            view_count, is_verified, is_featured,
            created_at, updated_at,
            brand:brands ( id, name ),
            category:categories ( id, name )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch listings: ${error.message}`)
    return data ?? []
}