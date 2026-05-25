// src/app/profile/page.tsx
// ============================================
// OWN PROFILE PAGE — /profile
//
// Auth-protected (middleware handles redirect to /login if not authed).
// Shows the current user's own profile with the edit button enabled.
//
// Uses the same ProfilePageClient and components as the public
// /profile/[id] page — just with isOwnProfile=true and a
// dashboard shortcut link.
// ============================================

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import {
    ClipboardDocumentListIcon,
    ShoppingBagIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProfilePageClient from '@/components/profile/ProfilePageClient'
import { getUserProfile } from '@/services/profileService'
import { getDevices } from '@/services/deviceService'
import { getSellerReviews, toDisplayReview } from '@/services/reviewService'

export default async function OwnProfilePage() {
    // ── Get current user (middleware guarantees auth, but be safe) ─
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?next=/profile')

    // ── Fetch all data in parallel ─────────────────────────────────
    const [profile, { devices: listings }, rawReviews] = await Promise.all([
        getUserProfile(user.id),
        getDevices({ sellerId: user.id, sortBy: 'newest', limit: 12 }),
        getSellerReviews(user.id, 20),
    ])

    if (!profile) redirect('/login')

    const reviews = rawReviews.map(toDisplayReview)

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

                {/* ── Header row with quick-nav links ── */}
                <div className="flex items-center justify-between mb-5 sm:mb-6 flex-wrap gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">My Profile</h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            This is how buyers see you on Go2Hand.
                        </p>
                    </div>

                    {/* Quick-access dashboard links */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/listings"
                            className="flex items-center gap-1.5 text-xs font-semibold
                                text-gray-600 hover:text-teal-800 bg-white border border-gray-200
                                hover:border-teal-400 px-3 py-2 rounded-xl transition-all"
                        >
                            <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                            Manage Listings
                        </Link>
                        <Link
                            href="/dashboard/orders"
                            className="flex items-center gap-1.5 text-xs font-semibold
                                text-gray-600 hover:text-teal-800 bg-white border border-gray-200
                                hover:border-teal-400 px-3 py-2 rounded-xl transition-all"
                        >
                            <ShoppingBagIcon className="w-3.5 h-3.5" />
                            My Orders
                        </Link>
                    </div>
                </div>

                <ProfilePageClient
                    profile={profile}
                    listings={listings}
                    reviews={reviews}
                    isOwnProfile={true}
                    userId={user.id}
                />
            </div>

            <Footer />
        </div>
    )
}

export const metadata = {
    title: 'My Profile — Go2Hand',
    description: 'View and edit your Go2Hand seller profile.',
}