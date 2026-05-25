'use server'

// src/actions/profile.ts
// ============================================
// PROFILE SERVER ACTIONS
//
// actionUpdateProfile — updates display name, bio, location, avatar
//
// Called from EditProfileModal (client component).
// Validates ownership — users can only edit their own profile.
// ============================================

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type ActionResult = { success: boolean; error?: string }

// ── Build SSR Supabase client ─────────────────────────────────────
async function createSupabaseServer() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c) => {
                    try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
                    catch { /* Server Component context — safe to ignore */ }
                },
            },
        }
    )
}

// ─────────────────────────────────────────────────────────────────
// ACTION: UPDATE PROFILE
//
// FormData fields:
//   full_name  — display name (optional)
//   bio        — short bio / about (optional)
//   location   — city/country (optional)
//   avatar_url — public URL from Supabase Storage (optional)
//
// All fields are optional — only provided fields are updated.
// ─────────────────────────────────────────────────────────────────
export async function actionUpdateProfile(
    formData: FormData
): Promise<ActionResult> {
    const supabase = await createSupabaseServer()

    // ── Auth guard ────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'You must be logged in to edit your profile' }

    // ── Build partial update (only present, non-null fields) ──────
    const updates: Record<string, string | null> = {
        updated_at: new Date().toISOString(),
    }

    const fullName  = formData.get('full_name')  as string | null
    const bio       = formData.get('bio')        as string | null
    const location  = formData.get('location')   as string | null
    const avatarUrl = formData.get('avatar_url') as string | null

    // Trim and set null for empty strings so we clear fields properly
    if (fullName  !== null) updates.full_name  = fullName.trim()  || null
    if (bio       !== null) updates.bio        = bio.trim()       || null
    if (location  !== null) updates.location   = location.trim()  || null
    if (avatarUrl !== null) updates.avatar_url = avatarUrl        || null

    // ── Validate display name length ──────────────────────────────
    if (updates.full_name && (updates.full_name as string).length > 50) {
        return { success: false, error: 'Display name must be 50 characters or fewer' }
    }
    if (updates.bio && (updates.bio as string).length > 300) {
        return { success: false, error: 'Bio must be 300 characters or fewer' }
    }

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

    if (error) return { success: false, error: error.message }

    // Bust cache for both own profile routes
    revalidatePath('/profile')
    revalidatePath(`/profile/${user.id}`)

    return { success: true }
}