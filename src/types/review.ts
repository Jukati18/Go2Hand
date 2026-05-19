// src/types/review.ts
// ============================================
// REVIEW TYPES — Go2Hand Review & Rating System
//
// Two rating dimensions unique to second-hand:
//   1. seller_rating    — communication, honesty, speed
//   2. accuracy_rating  — did device match the listing?
//
// DB table: reviews
//   id, order_id (unique), buyer_id, seller_id, product_id,
//   seller_rating, accuracy_rating, overall_rating,
//   title, body, created_at
// ============================================

export interface Review {
    id: string
    orderId: string
    buyerId: string
    sellerId: string
    productId: string

    /** Overall experience (1–5) — the headline star rating */
    overallRating: number

    /** Seller rating: communication, honesty, shipping speed (1–5) */
    sellerRating: number

    /** Device accuracy: did it match the listing? battery, grade, IMEI (1–5) */
    accuracyRating: number

    title: string | null
    body: string | null
    createdAt: string

    // Joined from users table
    buyer?: {
        id: string
        username: string
        avatarUrl: string | null
    }
}

// ─────────────────────────────────────────────────────────────────
// CREATE INPUT — what the review form submits
// ─────────────────────────────────────────────────────────────────
export interface CreateReviewInput {
    orderId: string
    sellerId: string
    productId: string
    overallRating: number    // 1–5
    sellerRating: number     // 1–5
    accuracyRating: number   // 1–5
    title?: string
    body?: string
}

// ─────────────────────────────────────────────────────────────────
// STATS — aggregated per product or seller
// ─────────────────────────────────────────────────────────────────
export interface ReviewStats {
    totalReviews: number
    averageOverall: number
    averageSeller: number
    averageAccuracy: number
    /** star value (1–5) → count of reviews with that star */
    distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

// ─────────────────────────────────────────────────────────────────
// DISPLAY SHAPE — used in DeviceDetailClient (maps to device.ts Review)
// ─────────────────────────────────────────────────────────────────
export interface DisplayReview {
    id: string
    reviewerName: string
    reviewerInitials: string
    avatarColor: string
    overallRating: number
    sellerRating: number
    accuracyRating: number
    title: string
    text: string       // maps from body
    date: string       // formatted createdAt
}