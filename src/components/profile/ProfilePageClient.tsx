'use client'

// src/components/profile/ProfilePageClient.tsx
// ============================================
// PROFILE PAGE CLIENT WRAPPER
//
// This thin client wrapper exists to:
//  1. Hold `editModalOpen` state (avoids "use client" on the whole page)
//  2. Trigger a full router.refresh() after a successful profile edit
//     so the server component re-fetches updated profile data
//
// Server page passes all data as props — no client-side fetching.
// ============================================

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProfileHeader from './ProfileHeader'
import ProfileTabs from './ProfileTabs'
import EditProfileModal from './EditProfileModal'
import type { UserProfile } from '@/services/profileService'
import type { Device } from '@/types/device'
import type { DisplayReview } from '@/types/review'

interface ProfilePageClientProps {
    profile: UserProfile
    listings: Device[]
    reviews: DisplayReview[]
    isOwnProfile: boolean
    /** Pass userId separately for EditProfileModal (avatar upload needs it) */
    userId: string
}

export default function ProfilePageClient({
    profile,
    listings,
    reviews,
    isOwnProfile,
    userId,
}: ProfilePageClientProps) {
    const router = useRouter()
    const [editOpen, setEditOpen] = useState(false)

    // After edit succeeds: close modal + refresh server data
    const handleEditSuccess = useCallback(() => {
        setEditOpen(false)
        router.refresh()
    }, [router])

    return (
        <>
            <div className="flex flex-col gap-5 sm:gap-6">
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    onEditClick={() => setEditOpen(true)}
                />
                <ProfileTabs
                    listings={listings}
                    reviews={reviews}
                    isOwnProfile={isOwnProfile}
                />
            </div>

            {/* Edit profile modal — only rendered when open */}
            {isOwnProfile && (
                <EditProfileModal
                    isOpen={editOpen}
                    profile={profile}
                    userId={userId}
                    onClose={() => setEditOpen(false)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </>
    )
}