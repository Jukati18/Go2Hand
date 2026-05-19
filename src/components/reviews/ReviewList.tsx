'use client'

// src/components/reviews/ReviewList.tsx
// ============================================
// REVIEW LIST — Full reviews section
//
// Layout:
//  • Left: aggregate score + breakdown bars
//  • Right: sub-rating averages (Seller / Accuracy)
//  • Full-width list of ReviewCards below
//
// Used in DeviceDetailClient in place of the
// previous hardcoded reviews section.
// ============================================

import { ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import ReviewCard from './ReviewCard'
import type { DisplayReview } from '@/types/review'
import type { ReviewStats } from '@/types/review'

interface ReviewListProps {
    reviews: DisplayReview[]
    stats: ReviewStats
}

// ── One breakdown bar row ────────────────────────────────────────
function BreakdownBar({
    star,
    count,
    total,
}: {
    star: number
    count: number
    total: number
}) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-4 text-right shrink-0">{star}★</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="w-4 text-right shrink-0">{count}</span>
        </div>
    )
}

// ── Sub-rating pill ──────────────────────────────────────────────
function SubRatingPill({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number
}) {
    return (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-amber-400 text-sm">★</span>
                <span className="text-sm font-bold text-gray-900">{value.toFixed(1)}</span>
            </div>
        </div>
    )
}

export default function ReviewList({ reviews, stats }: ReviewListProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* ── Section header ── */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <span className="text-amber-400">★</span>
                <h2 className="text-sm font-bold text-gray-900">
                    Reviews ({stats.totalReviews})
                </h2>
            </div>

            <div className="p-6">
                {stats.totalReviews === 0 ? (
                    // ── Empty state ──
                    <div className="text-center py-8">
                        <div className="text-4xl mb-3">⭐</div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                            No reviews yet
                        </p>
                        <p className="text-xs text-gray-400">
                            Reviews appear after buyers complete their purchase.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Stats header ── */}
                        <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-100">
                            {/* Left: big number + breakdown bars */}
                            <div className="flex items-center gap-6 flex-1">
                                <div className="shrink-0">
                                    <div className="text-4xl font-bold text-gray-900 leading-none mb-1">
                                        {stats.averageOverall.toFixed(1)}
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => (
                                            <span key={s}
                                                className={`text-base ${s <= Math.round(stats.averageOverall) ? 'text-amber-400' : 'text-gray-200'}`}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                {/* Breakdown bars */}
                                <div className="flex-1 flex flex-col gap-1.5">
                                    {([5, 4, 3, 2, 1] as const).map(star => (
                                        <BreakdownBar
                                            key={star}
                                            star={star}
                                            count={stats.distribution[star]}
                                            total={stats.totalReviews}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Right: sub-rating pills */}
                            <div className="flex flex-col gap-2 w-52 shrink-0">
                                <SubRatingPill
                                    icon={UserCircleIcon}
                                    label="Seller"
                                    value={stats.averageSeller}
                                />
                                <SubRatingPill
                                    icon={ShieldCheckIcon}
                                    label="Device Accuracy"
                                    value={stats.averageAccuracy}
                                />
                            </div>
                        </div>

                        {/* ── Review cards ── */}
                        <div className="flex flex-col">
                            {reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}