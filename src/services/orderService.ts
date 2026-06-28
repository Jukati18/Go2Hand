// ============================================
// ORDER SERVICE — Read operations
// Write operations are in orderWriteService.ts
//
// Supabase table: orders
// Maps snake_case DB columns → camelCase Order type
// ============================================

import { supabase } from '@/lib/supabaseClient'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Order, OrderStatus } from '@/types/order'

// ── Map raw Supabase row → Order ──────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(row: any): Order {
    return {
        id: row.id,
        buyerId: row.buyer_id,
        sellerId: row.seller_id,
        productId: row.product_id,

        amount: Number(row.amount),
        shippingFee: Number(row.shipping_fee ?? 0),
        platformFee: Number(row.platform_fee ?? 0),
        total: Number(row.total),

        status: row.status as OrderStatus,

        paidAt: row.paid_at ?? null,
        shippedAt: row.shipped_at ?? null,
        inspectionStartedAt: row.inspection_started_at ?? null,
        completedAt: row.completed_at ?? null,
        disputedAt: row.disputed_at ?? null,
        refundedAt: row.refunded_at ?? null,
        cancelledAt: row.cancelled_at ?? null,

        trackingNumber: row.tracking_number ?? null,
        shippingProvider: row.shipping_provider ?? null,
        shippingAddress: row.shipping_address ?? null,

        disputeReason: row.dispute_reason ?? null,
        stripePaymentIntentId: row.stripe_payment_intent_id ?? null,

        createdAt: row.created_at,
        updatedAt: row.updated_at,

        // Joined data from Supabase select (may be null if not joined)
        product: row.product
            ? {
                id: row.product.id,
                title: row.product.title,
                images: row.product.images ?? [],
                price: Number(row.product.price),
                brand: row.product.brand?.name ?? '',
            }
            : undefined,

        buyer: row.buyer
            ? {
                id: row.buyer.id,
                username: row.buyer.username ?? row.buyer.full_name ?? 'Unknown',
                avatarUrl: row.buyer.avatar_url ?? null,
            }
            : undefined,

        seller: row.seller
            ? {
                id: row.seller.id,
                username: row.seller.username ?? row.seller.full_name ?? 'Unknown',
                avatarUrl: row.seller.avatar_url ?? null,
            }
            : undefined,
    }
}

// ── Standard select string for orders ────────────────────────────
// Joins product + both users so we get display names and images
const ORDER_SELECT = `
    *,
    product:products (
        id, title, images, price,
        brand:brands ( name )
    ),
    buyer:users!reviewer_id ( id, username, full_name, avatar_url ),
    seller:users!seller_id ( id, username, full_name, avatar_url )
`

// ─────────────────────────────────────────────────────────────────
// GET SINGLE ORDER by ID
// ─────────────────────────────────────────────────────────────────
export async function getOrderById(
    orderId: string,
    client: SupabaseClient = supabase
): Promise<Order | null> {
    const { data, error } = await client
        .from('orders')
        .select(ORDER_SELECT)
        .eq('id', orderId)
        .single()

    if (error) {
        console.error('getOrderById:', error.message)
        return null
    }

    return mapOrder(data)
}

// ─────────────────────────────────────────────────────────────────
// GET ORDERS FOR A USER
// role = 'buyer'  → orders where this user purchased something
// role = 'seller' → orders where this user's device was bought
// ─────────────────────────────────────────────────────────────────
export async function getUserOrders(
    userId: string,
    role: 'buyer' | 'seller',
    statusFilter?: OrderStatus,
    client: SupabaseClient = supabase
): Promise<Order[]> {
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id'

    let query = client
        .from('orders')
        .select(ORDER_SELECT)
        .eq(column, userId)
        .order('created_at', { ascending: false })

    if (statusFilter) {
        query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
        console.error('getUserOrders:', error.message)
        return []
    }

    return (data ?? []).map(mapOrder)
}

// ─────────────────────────────────────────────────────────────────
// GET ORDERS IN INSPECTION (for admin dashboard)
// These are orders where buyer has 5 days to approve or dispute
// ─────────────────────────────────────────────────────────────────
export async function getOrdersInInspection(
    client: SupabaseClient = supabase
): Promise<Order[]> {
    const { data, error } = await client
        .from('orders')
        .select(ORDER_SELECT)
        .eq('status', 'in_inspection')
        .order('inspection_started_at', { ascending: true })

    if (error) {
        console.error('getOrdersInInspection:', error.message)
        return []
    }

    return (data ?? []).map(mapOrder)
}

// ─────────────────────────────────────────────────────────────────
// CALCULATE INSPECTION DAYS REMAINING
// Returns how many days the buyer has left to approve or dispute.
// Returns null if order is not in inspection, or 0 if expired.
// ─────────────────────────────────────────────────────────────────
export function getInspectionDaysRemaining(order: Order): number | null {
    if (order.status !== 'in_inspection' || !order.inspectionStartedAt) {
        return null
    }

    const INSPECTION_DAYS = 5
    const started = new Date(order.inspectionStartedAt).getTime()
    const deadline = started + INSPECTION_DAYS * 24 * 60 * 60 * 1000
    const now = Date.now()
    const remaining = Math.ceil((deadline - now) / (24 * 60 * 60 * 1000))

    return Math.max(0, remaining)
}

// ─────────────────────────────────────────────────────────────────
// FORMAT ORDER AMOUNT
// ─────────────────────────────────────────────────────────────────
export function formatOrderAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(amount)
}