// src/services/reviewWriteService.ts
// ============================================
// REVIEW WRITE SERVICE — create review
//
// IMPORTANT: this file is only ever invoked from server-side
// code (Server Actions in actions/review.ts, and the POST
// /api/reviews route handler). It must use the SSR server
// Supabase client (cookie-aware) so RLS policies checking
// auth.uid() can identify the caller correctly.
//
// Previously this used the browser singleton client, which has
// no cookies when executed on the server — auth.uid() resolved
// to null, RLS silently filtered out the order row, and the
// buyer got "Order not found or access denied" even when the
// order genuinely belonged to them.
//
// After inserting the review we recalculate and update the
// seller's aggregate rating on their users row so the seller
// card always shows up-to-date stats without an extra join.
// ============================================

import { createClient } from '@/lib/supabase/server'
import type { CreateReviewInput } from '@/types/review'

// ─────────────────────────────────────────────────────────────────
// CREATE REVIEW
//
// Guards:
//  • order must be 'completed'
//  • caller must be the buyer
//  • no duplicate review per order (unique constraint in DB)
//
// Returns the created review ID.
// ─────────────────────────────────────────────────────────────────
export async function createReview(
    buyerId: string,
    input: CreateReviewInput
): Promise<{ id: string }> {
    // Create a request-scoped, cookie-aware client so RLS sees the
    // real authenticated user instead of an anonymous session.
    const supabase = await createClient()

    // ── 1. Validate ratings are 1–5 ──────────────────────────────
    const ratings = [input.overallRating, input.sellerRating, input.accuracyRating]
    if (ratings.some(r => r < 1 || r > 5 || !Number.isInteger(r))) {
        throw new Error('All ratings must be integers between 1 and 5')
    }

    // ── 2. Confirm the order is completed and belongs to buyer ────
    const { data: order } = await supabase
        .from('orders')
        .select('id, buyer_id, status, seller_id, product_id')
        .eq('id', input.orderId)
        .eq('buyer_id', buyerId)
        .single()

    if (!order) throw new Error('Order not found or access denied')
    if (order.status !== 'completed') {
        throw new Error('You can only review completed orders')
    }

    // ── 3. Insert the review ──────────────────────────────────────
    // `comment` is a NOT NULL column, distinct from the nullable `body`
    // column the rest of the app (ReviewCard, ReviewList, reviewService.ts)
    // reads from for display. Mirror the same text into both so the DB
    // constraint is satisfied while existing read paths keep working
    // unchanged. Falls back to a placeholder if the buyer left no
    // written review (ratings-only submissions are allowed by the form).
    const reviewText = input.body?.trim() || input.title?.trim() || 'No written review provided.'

    // The unique constraint on (order_id) prevents duplicate reviews.
    const { data, error } = await supabase
        .from('reviews')
        .insert({
            order_id:        input.orderId,
            buyer_id:        buyerId,
            // The `reviews` table has a NOT NULL `reviewer_id` column in
            // addition to `buyer_id` (same person, legacy/duplicate column
            // name) — must be populated or the insert fails with a
            // not-null constraint violation.
            reviewer_id:     buyerId,
            seller_id:       input.sellerId,
            // Same situation as reviewer_id above: `reviewed_user_id` is a
            // NOT NULL duplicate of seller_id (the person being reviewed).
            reviewed_user_id: input.sellerId,
            product_id:      input.productId,
            overall_rating:  input.overallRating,
            seller_rating:   input.sellerRating,
            accuracy_rating: input.accuracyRating,
            title:           input.title?.trim()  || null,
            body:            input.body?.trim()   || null,
            // NOT NULL — see comment above on reviewText.
            comment:         reviewText,
        })
        .select('id')
        .single()

    if (error) {
        // Unique violation = already reviewed
        if (error.code === '23505') {
            throw new Error('You have already reviewed this order')
        }
        throw new Error(`Failed to submit review: ${error.message}`)
    }

    // ── 4. Recalculate seller's aggregate rating ──────────────────
    // Pull all reviews for this seller, compute new average, update user row.
    // We do this in JS (not DB trigger) to keep it simple for MVP.
    try {
        const { data: allSellerReviews } = await supabase
            .from('reviews')
            .select('overall_rating')
            .eq('seller_id', input.sellerId)

        if (allSellerReviews && allSellerReviews.length > 0) {
            const avg = allSellerReviews.reduce((s, r) => s + r.overall_rating, 0)
                / allSellerReviews.length
            const rounded = Math.round(avg * 10) / 10

            await supabase
                .from('users')
                .update({
                    seller_rating: rounded,
                    total_reviews: allSellerReviews.length,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', input.sellerId)
        }
    } catch (aggregateErr) {
        // Non-fatal — review is saved; rating sync can retry later
        console.error('reviewWriteService: seller rating sync failed', aggregateErr)
    }

    return { id: data.id }
}