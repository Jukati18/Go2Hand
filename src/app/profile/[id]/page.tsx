// src/app/profile/[id]/page.tsx
// ============================================
// PUBLIC PROFILE PAGE — /profile/[id]
//
// Server component — accessible to everyone (no auth required).
// Fetches profile, listings, and seller reviews in parallel.
// Detects if the viewer is the owner → shows edit button.
//
// Route: /profile/[userId]
// ============================================

import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProfilePageClient from '@/components/profile/ProfilePageClient'
import { getUserProfile } from '@/services/profileService'
import { getDevices } from '@/services/deviceService'
import { getSellerReviews, toDisplayReview } from '@/services/reviewService'

interface Props {
    params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: Props) {
    const { id: profileUserId } = await params

    // ── Fetch profile + listings + reviews in parallel ────────────
    const [profile, { devices: listings }, rawReviews] = await Promise.all([
        getUserProfile(profileUserId),
        getDevices({ sellerId: profileUserId, sortBy: 'newest', limit: 12 }),
        getSellerReviews(profileUserId, 20),
    ])

    if (!profile) notFound()

    const reviews = rawReviews.map(toDisplayReview)

    // ── Detect if the viewer is the owner (optional auth check) ──
    let currentUserId: string | null = null
    try {
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
        currentUserId = user?.id ?? null
    } catch {
        // Auth is optional on public profiles — continue gracefully
    }

    const isOwnProfile = currentUserId === profileUserId

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: profile.fullName ?? profile.username },
                    ]}
                    className="mb-5 sm:mb-6"
                />

                <ProfilePageClient
                    profile={profile}
                    listings={listings}
                    reviews={reviews}
                    isOwnProfile={isOwnProfile}
                    userId={profileUserId}
                />
            </div>

            <Footer />
        </div>
    )
}

// ── SEO metadata ──────────────────────────────────────────────────
export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const profile = await getUserProfile(id)
    if (!profile) return {}

    const name = profile.fullName ?? profile.username
    return {
        title: `${name} — Go2Hand Seller`,
        description: profile.bio
            ? `${profile.bio} · ${profile.totalSales} devices sold on Go2Hand`
            : `Browse ${name}'s verified device listings on Go2Hand.`,
    }
}