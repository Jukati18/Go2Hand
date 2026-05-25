// src/services/profileService.ts
// ============================================
// PROFILE SERVICE — fetch user profile data
//
// Provides:
//   getUserProfile(userId)      → full public profile
//   getProfileByUsername(name)  → look up by @username
//
// NOTE: The `bio` column must exist in the users table.
// If it doesn't yet, run:
//   ALTER TABLE users ADD COLUMN bio TEXT;
// ============================================

import { supabase } from '@/lib/supabaseClient'

// ── Public profile shape ───────────────────────────────────────────
export interface UserProfile {
    id: string
    username: string
    fullName: string | null
    bio: string | null
    avatarUrl: string | null
    location: string | null
    /** 'verified' | null | other string from Supabase enum */
    isVerified: boolean
    sellerRating: number      // 0–5.0
    totalSales: number
    totalReviews: number
    memberSince: string       // e.g. "June 2024"
    joinedAt: string          // ISO timestamp (for relative display)
    responseTime: string      // hardcoded for MVP
}

// ── Raw → typed mapper ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: any): UserProfile {
    return {
        id: row.id,
        username: row.username ?? 'Unknown',
        fullName: row.full_name ?? null,
        bio: row.bio ?? null,
        avatarUrl: row.avatar_url ?? null,
        location: row.location ?? null,
        isVerified: row.verified === 'verified',
        sellerRating: Number(row.seller_rating ?? 0),
        totalSales: Number(row.total_sales ?? 0),
        totalReviews: Number(row.total_reviews ?? 0),
        memberSince: new Date(row.created_at).toLocaleDateString('en-US', {
            month: 'long', year: 'numeric',
        }),
        joinedAt: row.created_at,
        responseTime: '< 2 hrs',
    }
}

// ─────────────────────────────────────────────────────────────────
// GET USER PROFILE by ID
// ─────────────────────────────────────────────────────────────────
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select(`
            id, username, full_name, bio, avatar_url,
            location, verified, seller_rating,
            total_sales, total_reviews, created_at
        `)
        .eq('id', userId)
        .single()

    if (error || !data) {
        console.error('getUserProfile:', error?.message)
        return null
    }

    return mapProfile(data)
}

// ─────────────────────────────────────────────────────────────────
// GET PROFILE BY USERNAME
// Useful for public-facing /profile/@username routes
// ─────────────────────────────────────────────────────────────────
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select(`
            id, username, full_name, bio, avatar_url,
            location, verified, seller_rating,
            total_sales, total_reviews, created_at
        `)
        .eq('username', username)
        .single()

    if (error || !data) return null
    return mapProfile(data)
}