'use client'

// src/components/profile/ProfileHeader.tsx
// ============================================
// PROFILE HEADER
//
// Displays:
//  • Avatar (real image OR gradient initials fallback)
//  • Verified badge (shield icon + text)
//  • Display name + @username
//  • Bio / about text
//  • Location + Member since
//  • Stats bar: Rating ★ · Sales · Reviews
//  • Edit Profile button (own profile only)
//  • Response time chip
//
// Props:
//   profile        — UserProfile shape from profileService
//   isOwnProfile   — shows edit button if true
//   onEditClick    — opens EditProfileModal
// ============================================

import Image from 'next/image'
import {
    ShieldCheckIcon,
    MapPinIcon,
    CalendarDaysIcon,
    ClockIcon,
    StarIcon,
    PencilSquareIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'
import type { UserProfile } from '@/services/profileService'

// ── Avatar gradient pool — matches deviceService.ts ───────────────
const AVATAR_GRADIENTS = [
    'from-teal-500 to-emerald-500',
    'from-violet-500 to-purple-500',
    'from-orange-500 to-red-500',
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
]

function pickGradient(seed: string): string {
    return AVATAR_GRADIENTS[seed.charCodeAt(0) % AVATAR_GRADIENTS.length]
}

function toInitials(name: string): string {
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// ── Star rating display ────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
    const filled = Math.round(rating)
    return (
        <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={`text-sm ${s <= filled ? 'text-amber-400' : 'text-gray-200'}`}>
                    ★
                </span>
            ))}
        </span>
    )
}

// ── Props ─────────────────────────────────────────────────────────
interface ProfileHeaderProps {
    profile: UserProfile
    isOwnProfile?: boolean
    onEditClick?: () => void
}

// ─────────────────────────────────────────────────────────────────
export default function ProfileHeader({
    profile,
    isOwnProfile = false,
    onEditClick,
}: ProfileHeaderProps) {
    const gradient     = pickGradient(profile.id)
    const displayName  = profile.fullName ?? profile.username
    const initials     = toInitials(displayName)

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* ── Teal top banner ── */}
            <div className="h-24 sm:h-32 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 relative">
                {/* Subtle pattern overlay */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                                         radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Edit button — top right of banner */}
                {isOwnProfile && (
                    <button
                        onClick={onEditClick}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4
                            flex items-center gap-1.5 bg-white/20 hover:bg-white/30
                            backdrop-blur-sm text-white text-xs font-semibold
                            px-3 py-1.5 rounded-full border border-white/30
                            transition-all duration-200 hover:scale-105"
                    >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="px-5 sm:px-7 pb-6">

                {/* ── Avatar — overlaps the banner ── */}
                <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-4">
                    <div className="relative">
                        {/* Outer ring */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl
                            bg-white border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
                            {profile.avatarUrl ? (
                                <Image
                                    src={profile.avatarUrl}
                                    alt={displayName}
                                    width={96}
                                    height={96}
                                    sizes="96px"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${gradient}
                                    flex items-center justify-center`}>
                                    <span className="text-white font-black text-2xl sm:text-3xl
                                        tracking-tight select-none">
                                        {initials}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Verified badge overlaid on avatar bottom-right */}
                        {profile.isVerified && (
                            <div className="absolute -bottom-1.5 -right-1.5
                                w-7 h-7 bg-emerald-500 rounded-full
                                flex items-center justify-center
                                border-2 border-white shadow-sm"
                                title="Verified Seller"
                            >
                                <ShieldSolid className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Verification pill — desktop */}
                    {profile.isVerified && (
                        <div className="hidden sm:flex items-center gap-1.5
                            bg-emerald-50 border border-emerald-200
                            text-emerald-800 text-xs font-bold
                            px-3 py-1.5 rounded-full">
                            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                            Verified Seller
                        </div>
                    )}
                </div>

                {/* ── Name row ── */}
                <div className="mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                            {displayName}
                        </h1>
                        {/* Verified badge — mobile (inline with name) */}
                        {profile.isVerified && (
                            <span className="sm:hidden inline-flex items-center gap-1
                                bg-emerald-50 text-emerald-700 text-[10px] font-bold
                                px-2 py-0.5 rounded-full border border-emerald-200">
                                <ShieldSolid className="w-2.5 h-2.5" />
                                Verified
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>
                </div>

                {/* ── Bio ── */}
                {profile.bio ? (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 max-w-xl">
                        {profile.bio}
                    </p>
                ) : isOwnProfile ? (
                    <button
                        onClick={onEditClick}
                        className="text-sm text-gray-400 hover:text-teal-600 mb-4
                            italic flex items-center gap-1.5 transition-colors group"
                    >
                        <PencilSquareIcon className="w-3.5 h-3.5 group-hover:text-teal-500" />
                        Add a bio…
                    </button>
                ) : (
                    <p className="text-sm text-gray-400 italic mb-4">No bio yet.</p>
                )}

                {/* ── Location + Joined ── */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-5 flex-wrap">
                    {profile.location && (
                        <span className="flex items-center gap-1.5">
                            <MapPinIcon className="w-3.5 h-3.5 text-gray-300" />
                            {profile.location}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="w-3.5 h-3.5 text-gray-300" />
                        Member since {profile.memberSince}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5 text-gray-300" />
                        Responds in {profile.responseTime}
                    </span>
                </div>

                {/* ── Stats bar ── */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {/* Rating */}
                    <div className="bg-gray-50 rounded-xl px-3 sm:px-4 py-3.5 text-center
                        border border-gray-100 hover:border-teal-200 transition-colors">
                        <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none mb-1">
                            {profile.sellerRating > 0
                                ? profile.sellerRating.toFixed(1)
                                : '—'
                            }
                        </div>
                        <div className="flex justify-center mb-1">
                            <StarRating rating={profile.sellerRating} />
                        </div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            Rating
                        </div>
                    </div>

                    {/* Sales */}
                    <div className="bg-gray-50 rounded-xl px-3 sm:px-4 py-3.5 text-center
                        border border-gray-100 hover:border-teal-200 transition-colors">
                        <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none mb-1.5">
                            {profile.totalSales}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            Devices Sold
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-gray-50 rounded-xl px-3 sm:px-4 py-3.5 text-center
                        border border-gray-100 hover:border-teal-200 transition-colors">
                        <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none mb-1.5">
                            {profile.totalReviews}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            Reviews
                        </div>
                    </div>
                </div>

                {/* ── Verification detail banner — only for verified sellers ── */}
                {profile.isVerified && (
                    <div className="mt-4 flex items-start gap-3
                        bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-emerald-900 mb-0.5">
                                Go2Hand Verified Seller
                            </p>
                            <p className="text-xs text-emerald-700 leading-relaxed">
                                Identity confirmed, listing accuracy reviewed, and trust score evaluated
                                by the Go2Hand team.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}