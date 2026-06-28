// src/services/reviewService.ts
// ============================================
// REVIEW SERVICE — Read operations
// Write operations live in reviewWriteService.ts
//
// FIX: The reviews table references users via `reviewer_id` (not
// `buyer_id`). Using `users!buyer_id` caused Supabase to throw:
//   "Could not find a relationship between 'reviews' and 'users'"
// because `buyer_id` has no FK constraint to the users table.
//
// The correct join hint is `users!reviewer_id(...)`.
// ============================================

import { supabase } from '@/lib/supabaseClient'
import type { Review, ReviewStats, DisplayReview } from '@/types/review'

// ── Avatar color pool (matches deviceService.ts) ─────────────────
const AVATAR_COLORS = [
    'from-teal-500 to-emerald-500',
    'from-violet-500 to-purple-500',
    'from-orange-500 to-red-500',
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
]
function pickColor(seed: string): string {
    return AVATAR_COLORS[seed.charCodeAt(0) % AVATAR_COLORS.length]
}
function toInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Standard select for review rows ──────────────────────────────
// Uses `reviewer_id` as the FK hint — this is the actual column
// in the reviews table that has a foreign key to users.
const REVIEW_SELECT = `
    id, order_id, reviewer_id, buyer_id, seller_id, product_id,
    overall_rating, seller_rating, accuracy_rating,
    title, body, created_at,
    buyer:users!reviewer_id ( id, username, full_name, avatar_url )
`

// ── Map raw Supabase row → Review ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: any): Review {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = row.buyer as any
    return {
        id: row.id,
        orderId: row.order_id,
        // reviewer_id is the FK to users; buyer_id is a denormalized alias
        buyerId: row.reviewer_id ?? row.buyer_id,
        sellerId: row.seller_id,
        productId: row.product_id,
        overallRating: row.overall_rating,
        sellerRating: row.seller_rating,
        accuracyRating: row.accuracy_rating,
        title: row.title ?? null,
        body: row.body ?? null,
        createdAt: row.created_at,
        buyer: b
            ? {
                id: b.id,
                username: b.username ?? b.full_name ?? 'Anonymous',
                avatarUrl: b.avatar_url ?? null,
            }
            : undefined,
    }
}

// ── Map Review → DisplayReview (for DeviceDetailClient) ───────────
export function toDisplayReview(r: Review): DisplayReview {
    const name = r.buyer?.username ?? 'Anonymous'
    const seed = r.buyer?.id ?? r.buyerId
    return {
        id: r.id,
        reviewerName: name,
        reviewerInitials: toInitials(name),
        avatarColor: `bg-gradient-to-br ${pickColor(seed)}`,
        overallRating: r.overallRating,
        sellerRating: r.sellerRating,
        accuracyRating: r.accuracyRating,
        title: r.title ?? '',
        text: r.body ?? '',
        date: new Date(r.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        }),
    }
}

// ─────────────────────────────────────────────────────────────────
// GET REVIEWS FOR A PRODUCT (device detail page)
// ─────────────────────────────────────────────────────────────────
export async function getProductReviews(
    productId: string,
    limit = 20
): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select(REVIEW_SELECT)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('getProductReviews:', error.message)
        return []
    }
    return (data ?? []).map(mapReview)
}

// ─────────────────────────────────────────────────────────────────
// GET REVIEWS FOR A SELLER (seller profile)
// ─────────────────────────────────────────────────────────────────
export async function getSellerReviews(
    sellerId: string,
    limit = 20
): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select(REVIEW_SELECT)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('getSellerReviews:', error.message)
        return []
    }
    return (data ?? []).map(mapReview)
}

// ─────────────────────────────────────────────────────────────────
// GET REVIEW STATS — aggregate ratings for a product or seller
// ─────────────────────────────────────────────────────────────────
export async function getReviewStats(
    field: 'product_id' | 'seller_id',
    id: string
): Promise<ReviewStats> {
    const { data, error } = await supabase
        .from('reviews')
        .select('overall_rating, seller_rating, accuracy_rating')
        .eq(field, id)

    const empty: ReviewStats = {
        totalReviews: 0,
        averageOverall: 0,
        averageSeller: 0,
        averageAccuracy: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }

    if (error || !data || data.length === 0) return empty

    const total = data.length
    const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let sumOverall = 0, sumSeller = 0, sumAccuracy = 0

    for (const r of data) {
        sumOverall  += r.overall_rating
        sumSeller   += r.seller_rating
        sumAccuracy += r.accuracy_rating
        const star = Math.round(r.overall_rating) as 1 | 2 | 3 | 4 | 5
        if (star >= 1 && star <= 5) dist[star]++
    }

    const avg = (n: number) => Math.round((n / total) * 10) / 10

    return {
        totalReviews: total,
        averageOverall: avg(sumOverall),
        averageSeller: avg(sumSeller),
        averageAccuracy: avg(sumAccuracy),
        distribution: dist,
    }
}

// ─────────────────────────────────────────────────────────────────
// CAN USER REVIEW? — buyer with a completed order, not yet reviewed
// ─────────────────────────────────────────────────────────────────
export async function canUserReview(
    orderId: string,
    userId: string
): Promise<{ eligible: boolean; reason?: string }> {
    // 1. Order must exist, be completed, and belong to this buyer
    const { data: order } = await supabase
        .from('orders')
        .select('id, buyer_id, status')
        .eq('id', orderId)
        .eq('buyer_id', userId)
        .single()

    if (!order) return { eligible: false, reason: 'Order not found' }
    if (order.status !== 'completed') {
        return { eligible: false, reason: 'Order is not yet completed' }
    }

    // 2. Must not already have a review for this order
    const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle()

    if (existing) return { eligible: false, reason: 'Already reviewed' }

    return { eligible: true }
}

// ─────────────────────────────────────────────────────────────────
// GET USER'S REVIEW for a specific order (to show "already reviewed")
// ─────────────────────────────────────────────────────────────────
export async function getUserOrderReview(
    orderId: string
): Promise<Review | null> {
    const { data, error } = await supabase
        .from('reviews')
        .select(REVIEW_SELECT)
        .eq('order_id', orderId)
        .maybeSingle()

    if (error || !data) return null
    return mapReview(data)
}