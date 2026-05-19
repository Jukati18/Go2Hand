// src/app/api/reviews/route.ts
// ============================================
// /api/reviews — Reviews REST API
//
// GET  /api/reviews?product_id=X   → list reviews for a device
// GET  /api/reviews?seller_id=X    → list reviews for a seller
// POST /api/reviews                → submit a review (auth required)
//
// These REST routes complement the Server Actions
// and allow external integrations (mobile apps, etc.)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
    getProductReviews,
    getSellerReviews,
    getReviewStats,
    canUserReview,
} from '@/services/reviewService'
import { createReview } from '@/services/reviewWriteService'
import type { CreateReviewInput } from '@/types/review'

// ─────────────────────────────────────────────────────────────────
// GET /api/reviews
// Query: ?product_id=X | ?seller_id=X | ?order_id=X&check=eligible
// ─────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const productId = searchParams.get('product_id')
        const sellerId  = searchParams.get('seller_id')
        const orderId   = searchParams.get('order_id')
        const check     = searchParams.get('check')
        const limit     = Number(searchParams.get('limit') ?? 20)

        // ── Eligibility check ─────────────────────────────────────
        // GET /api/reviews?order_id=X&check=eligible
        if (orderId && check === 'eligible') {
            const cookieStore = await cookies()
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
            )
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return NextResponse.json({ eligible: false, reason: 'Not authenticated' })

            const result = await canUserReview(orderId, user.id)
            return NextResponse.json(result)
        }

        // ── Reviews for a product ─────────────────────────────────
        if (productId) {
            const [reviews, stats] = await Promise.all([
                getProductReviews(productId, limit),
                getReviewStats('product_id', productId),
            ])
            return NextResponse.json({ success: true, data: reviews, stats })
        }

        // ── Reviews for a seller ──────────────────────────────────
        if (sellerId) {
            const [reviews, stats] = await Promise.all([
                getSellerReviews(sellerId, limit),
                getReviewStats('seller_id', sellerId),
            ])
            return NextResponse.json({ success: true, data: reviews, stats })
        }

        return NextResponse.json(
            { success: false, error: 'Provide product_id or seller_id query param' },
            { status: 400 }
        )

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/reviews
// Body: CreateReviewInput (JSON)
// ─────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        // ── Auth ──────────────────────────────────────────────────
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll:  () => cookieStore.getAll(),
                    setAll: (c) => {
                        try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
                        catch { }
                    },
                },
            }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            )
        }

        // ── Parse body ─────────────────────────────────────────────
        let body: CreateReviewInput
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON body' },
                { status: 400 }
            )
        }

        // ── Validate required fields ───────────────────────────────
        const required = ['orderId', 'sellerId', 'productId', 'overallRating', 'sellerRating', 'accuracyRating']
        const missing = required.filter(f => !body[f as keyof CreateReviewInput])
        if (missing.length > 0) {
            return NextResponse.json(
                { success: false, error: `Missing: ${missing.join(', ')}` },
                { status: 400 }
            )
        }

        const { id } = await createReview(user.id, body)

        return NextResponse.json({ success: true, data: { id } }, { status: 201 })

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        const status = message.includes('already reviewed') ? 409
            : message.includes('completed')                 ? 403
            : 500
        return NextResponse.json({ success: false, error: message }, { status })
    }
}