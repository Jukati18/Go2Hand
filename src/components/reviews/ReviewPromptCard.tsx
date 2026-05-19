'use client'

// src/components/reviews/ReviewPromptCard.tsx
// ============================================
// REVIEW PROMPT CARD
//
// Shown on /orders/[id] when:
//   • Order status === 'completed'
//   • Current user is the buyer
//   • No review has been left yet
//
// States:
//  'prompt'   → CTA to open the form
//  'reviewed' → Success state (after submit OR pre-existing review)
//
// Props:
//   hasReviewed — pre-populated from server (avoids flash)
//   orderId, sellerId, productId, productTitle, productImage
//   existingRating — if already reviewed, show the stars
// ============================================

import { useState } from 'react'
import Image from 'next/image'
import {
    StarIcon,
    CheckCircleIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import ReviewForm from './ReviewForm'

interface ReviewPromptCardProps {
    hasReviewed: boolean
    orderId: string
    sellerId: string
    productId: string
    productTitle: string
    productImage?: string
    existingRating?: number   // pass if hasReviewed = true so we show the stars
}

export default function ReviewPromptCard({
    hasReviewed: initialHasReviewed,
    orderId,
    sellerId,
    productId,
    productTitle,
    productImage,
    existingRating,
}: ReviewPromptCardProps) {
    const [hasReviewed, setHasReviewed] = useState(initialHasReviewed)
    const [formOpen, setFormOpen] = useState(false)

    // After successful submit → switch to reviewed state immediately
    function handleReviewSuccess() {
        setHasReviewed(true)
        setFormOpen(false)
    }

    // ── REVIEWED state ────────────────────────────────────────────
    if (hasReviewed) {
        return (
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5
                flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center
                    justify-center shrink-0">
                    <CheckSolid className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Review Submitted</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Thank you for helping the Go2Hand community!
                    </p>
                    {existingRating && (
                        <div className="flex gap-0.5 mt-1.5">
                            {[1,2,3,4,5].map(s => (
                                <span key={s}
                                    className={`text-sm ${s <= existingRating ? 'text-amber-400' : 'text-gray-200'}`}>
                                    ★
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ── PROMPT state ──────────────────────────────────────────────
    return (
        <>
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                {/* Amber accent top bar */}
                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />

                <div className="p-5 flex items-center gap-4">
                    {/* Device thumbnail */}
                    {productImage && (
                        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100
                            flex items-center justify-center shrink-0 overflow-hidden">
                            <Image
                                src={productImage}
                                alt={productTitle}
                                width={56}
                                height={56}
                                className="w-full h-full object-contain p-1"
                                unoptimized
                            />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            <StarIcon className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-sm font-bold text-gray-900">
                                How was your purchase?
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-1">
                            {productTitle}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Rate the seller &amp; device accuracy to help future buyers.
                        </p>
                    </div>

                    {/* CTA button */}
                    <button
                        onClick={() => setFormOpen(true)}
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400
                            text-white font-semibold px-4 py-2.5 rounded-xl text-sm
                            transition-all hover:-translate-y-0.5 hover:shadow-md shrink-0"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        Write Review
                    </button>
                </div>
            </div>

            {/* Review form modal */}
            <ReviewForm
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSuccess={handleReviewSuccess}
                orderId={orderId}
                sellerId={sellerId}
                productId={productId}
                productTitle={productTitle}
                productImage={productImage}
            />
        </>
    )
}