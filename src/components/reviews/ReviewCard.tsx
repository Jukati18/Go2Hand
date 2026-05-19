'use client'

// src/components/reviews/ReviewCard.tsx
// ============================================
// REVIEW CARD — Renders one review
//
// Shows:
//  • Reviewer avatar (initials + gradient color)
//  • Overall star rating
//  • Sub-ratings: Seller ★ · Accuracy ★
//  • Optional title (bold)
//  • Review body text
//  • "X days ago" timestamp
// ============================================

import { ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import type { DisplayReview } from '@/types/review'

interface ReviewCardProps {
    review: DisplayReview
    /** If true, renders with a subtle border (for standalone display) */
    bordered?: boolean
}

// Render filled/empty stars inline
function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
    const cls = size === 'sm' ? 'text-sm' : 'text-base'
    return (
        <span className={`flex gap-0.5 ${cls}`} aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={s <= Math.round(value) ? 'text-amber-400' : 'text-gray-200'}>
                    ★
                </span>
            ))}
        </span>
    )
}

// "3 days ago" / "today" relative time
function relativeDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return '1 day ago'
    if (diff < 30)  return `${diff} days ago`
    if (diff < 365) return `${Math.floor(diff / 30)} months ago`
    return `${Math.floor(diff / 365)} year${Math.floor(diff / 365) > 1 ? 's' : ''} ago`
}

export default function ReviewCard({ review, bordered = false }: ReviewCardProps) {
    return (
        <div className={`py-5 first:pt-0 last:pb-0 ${bordered ? 'border border-gray-100 rounded-xl p-5' : 'border-b border-gray-50 last:border-b-0'}`}>
            {/* ── Top row: avatar + name + date ── */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full ${review.avatarColor}
                        flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {review.reviewerInitials}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {review.reviewerName}
                        </p>
                        {/* Sub-ratings row */}
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <UserCircleIcon className="w-3 h-3 text-teal-500" />
                                Seller
                                <span className="flex gap-0.5 ml-0.5">
                                    {[1,2,3,4,5].map(s => (
                                        <span key={s}
                                            className={`text-[10px] ${s <= review.sellerRating ? 'text-amber-400' : 'text-gray-200'}`}>
                                            ★
                                        </span>
                                    ))}
                                </span>
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <ShieldCheckIcon className="w-3 h-3 text-teal-500" />
                                Accuracy
                                <span className="flex gap-0.5 ml-0.5">
                                    {[1,2,3,4,5].map(s => (
                                        <span key={s}
                                            className={`text-[10px] ${s <= review.accuracyRating ? 'text-amber-400' : 'text-gray-200'}`}>
                                            ★
                                        </span>
                                    ))}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Overall stars + relative date */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <Stars value={review.overallRating} />
                    <span className="text-[10px] text-gray-400">{relativeDate(review.date)}</span>
                </div>
            </div>

            {/* ── Review title ── */}
            {review.title && (
                <p className="text-sm font-semibold text-gray-800 mb-1">{review.title}</p>
            )}

            {/* ── Review body ── */}
            {review.text ? (
                <p className="text-[13px] text-gray-500 leading-relaxed">{review.text}</p>
            ) : (
                <p className="text-[13px] text-gray-400 italic">No written review</p>
            )}
        </div>
    )
}