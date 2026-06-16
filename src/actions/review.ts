'use server'

// src/actions/review.ts
// ============================================
// REVIEW SERVER ACTIONS
//
// "use server" — Next.js runs these on the server
// even when called from a client component.
//
// Single action: actionSubmitReview
//   1. Auth guard
//   2. Parse + validate FormData
//   3. Call reviewWriteService.createReview
//   4. Revalidate device detail + order pages
// ============================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createReview } from '@/services/reviewWriteService'
import type { CreateReviewInput } from '@/types/review'

type ActionResult = {
    success: boolean
    error?: string
    reviewId?: string
}

// ── Get current authenticated user ────────────────────────────────
async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}

// ─────────────────────────────────────────────────────────────────
// ACTION: SUBMIT REVIEW
//
// Called from ReviewForm. FormData fields:
//   order_id, seller_id, product_id,
//   overall_rating, seller_rating, accuracy_rating,
//   title (optional), body (optional)
// ─────────────────────────────────────────────────────────────────
export async function actionSubmitReview(
    formData: FormData
): Promise<ActionResult> {
    // ── 1. Auth guard ─────────────────────────────────────────────
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in to leave a review' }
    }

    try {
        // ── 2. Parse FormData ─────────────────────────────────────
        const orderId   = formData.get('order_id')   as string
        const sellerId  = formData.get('seller_id')  as string
        const productId = formData.get('product_id') as string

        const overallRating  = Number(formData.get('overall_rating'))
        const sellerRating   = Number(formData.get('seller_rating'))
        const accuracyRating = Number(formData.get('accuracy_rating'))

        const title = (formData.get('title') as string | null)?.trim() || undefined
        const body  = (formData.get('body')  as string | null)?.trim() || undefined

        // ── 3. Basic validation ───────────────────────────────────
        if (!orderId || !sellerId || !productId) {
            return { success: false, error: 'Missing required fields' }
        }
        if ([overallRating, sellerRating, accuracyRating].some(r => isNaN(r) || r < 1 || r > 5)) {
            return { success: false, error: 'All ratings must be between 1 and 5' }
        }

        const input: CreateReviewInput = {
            orderId,
            sellerId,
            productId,
            overallRating,
            sellerRating,
            accuracyRating,
            title,
            body,
        }

        // ── 4. Create review ──────────────────────────────────────
        const { id } = await createReview(userId, input)

        // ── 5. Revalidate pages that show reviews ─────────────────
        // Device detail — rating stars update immediately
        revalidatePath(`/devices/${productId}`)
        // Order page — prompt card switches to "reviewed" state
        revalidatePath(`/orders/${orderId}`)
        // Seller profile (if it exists)
        revalidatePath(`/profile/${sellerId}`)

        return { success: true, reviewId: id }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        return { success: false, error: message }
    }
}