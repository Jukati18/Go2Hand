'use client'

// src/components/profile/ProfileTabs.tsx
// ============================================
// PROFILE TABS
//
// Tab 1: Listings — DeviceCard grid of their active devices
// Tab 2: Reviews  — ReviewCard list of reviews they received
//
// Designed as a client component so switching tabs is instant
// (no page reload). Data is passed as props from the server page.
// ============================================

import { useState } from 'react'
import Link from 'next/link'
import { TagIcon, StarIcon } from '@heroicons/react/24/outline'
import DeviceCard from '@/components/devices/DeviceCard'
import ReviewCard from '@/components/reviews/ReviewCard'
import type { Device } from '@/types/device'
import type { DisplayReview } from '@/types/review'

// ── Tab config ────────────────────────────────────────────────────
const TABS = [
    { id: 'listings', label: 'Listings', icon: TagIcon },
    { id: 'reviews',  label: 'Reviews',  icon: StarIcon },
] as const

type TabId = (typeof TABS)[number]['id']

interface ProfileTabsProps {
    listings: Device[]
    reviews:  DisplayReview[]
    isOwnProfile?: boolean
}

// ─────────────────────────────────────────────────────────────────
export default function ProfileTabs({
    listings,
    reviews,
    isOwnProfile = false,
}: ProfileTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>('listings')

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* ── Tab bar ── */}
            <div className="flex border-b border-gray-100 px-4 sm:px-6 gap-1 pt-2">
                {TABS.map(({ id, label, icon: Icon }) => {
                    const count = id === 'listings' ? listings.length : reviews.length
                    const isActive = activeTab === id

                    return (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold
                                border-b-2 transition-all duration-200 -mb-px
                                ${isActive
                                    ? 'border-teal-600 text-teal-800'
                                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                            {count > 0 && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full
                                    ${isActive
                                        ? 'bg-teal-100 text-teal-800'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ── Tab content ── */}
            <div className="p-4 sm:p-6">

                {/* ── LISTINGS TAB ── */}
                {activeTab === 'listings' && (
                    <div>
                        {listings.length === 0 ? (
                            <EmptyState
                                icon={TagIcon}
                                title="No active listings"
                                desc={isOwnProfile
                                    ? "You haven't listed any devices yet. Start selling!"
                                    : 'This seller has no active listings right now.'
                                }
                                cta={isOwnProfile ? (
                                    <Link
                                        href="/sell"
                                        className="inline-flex items-center gap-2 bg-teal-800
                                            hover:bg-teal-700 text-white font-semibold
                                            px-5 py-2.5 rounded-xl text-sm transition-all
                                            hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        + List a Device
                                    </Link>
                                ) : null}
                            />
                        ) : (
                            <>
                                {/* 2-col mobile → 3-col md → 4-col if many */}
                                <div className={`grid gap-3 sm:gap-4
                                    ${listings.length >= 3
                                        ? 'grid-cols-2 sm:grid-cols-3'
                                        : 'grid-cols-2 sm:grid-cols-2'
                                    }`}>
                                    {listings.map((device, i) => (
                                        <div
                                            key={device.id}
                                            className="animate-[fadeUp_.35s_ease_both]"
                                            style={{ animationDelay: `${i * 40}ms` }}
                                        >
                                            <DeviceCard device={device} />
                                        </div>
                                    ))}
                                </div>

                                {/* Own profile CTA */}
                                {isOwnProfile && (
                                    <div className="mt-5 pt-5 border-t border-gray-100 text-center">
                                        <Link
                                            href="/sell"
                                            className="inline-flex items-center gap-2 border-2
                                                border-teal-800 text-teal-800 font-semibold
                                                px-5 py-2.5 rounded-xl text-sm
                                                hover:bg-teal-800 hover:text-white
                                                transition-all duration-200"
                                        >
                                            + Add Another Listing
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── REVIEWS TAB ── */}
                {activeTab === 'reviews' && (
                    <div>
                        {reviews.length === 0 ? (
                            <EmptyState
                                icon={StarIcon}
                                title="No reviews yet"
                                desc={isOwnProfile
                                    ? 'Reviews will appear here once buyers complete purchases from you.'
                                    : "This seller hasn't received any reviews yet."
                                }
                            />
                        ) : (
                            <div className="flex flex-col">
                                {reviews.map(review => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Empty state helper ────────────────────────────────────────────
function EmptyState({
    icon: Icon,
    title,
    desc,
    cta,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    desc: string
    cta?: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-700 mb-1">{title}</p>
            <p className="text-sm text-gray-400 mb-5 max-w-xs leading-relaxed">{desc}</p>
            {cta}
        </div>
    )
}