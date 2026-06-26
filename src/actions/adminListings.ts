'use server'

// src/actions/adminListings.ts
// ─────────────────────────────────────────────────────────────────
// ADMIN — LISTING MODERATION ACTIONS
//
// Server Actions called from <ListingsTable> client component.
// All actions require the caller to be role = 'admin'.
//
// Actions:
//   • actionAdminUpdateListing — change status, toggle featured/verified
//   • actionAdminDeleteListing — hard delete (irreversible, admin only)
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'

export type ListingStatus = 'active' | 'inactive' | 'sold' | 'pending_review'

export interface AdminUpdateListingPayload {
    status?: ListingStatus
    is_featured?: boolean
    is_verified?: boolean
}

// ── Build SSR Supabase client + verify admin role ─────────────────
async function getAdminSupabase() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { /* Server Component context */ }
                },
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { supabase: null, error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { supabase: null, error: 'Forbidden' }

    return { supabase, error: null }
}

// ─────────────────────────────────────────────────────────────────
// UPDATE LISTING — change status / featured / verified flags
// ─────────────────────────────────────────────────────────────────
export async function actionAdminUpdateListing(
    listingId: string,
    payload: AdminUpdateListingPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, error: authError } = await getAdminSupabase()
        if (!supabase) return { success: false, error: authError ?? 'Unauthorized' }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (payload.status !== undefined)      updateData.status       = payload.status
        if (payload.is_featured !== undefined)  updateData.is_featured  = payload.is_featured
        if (payload.is_verified !== undefined)  updateData.is_verified  = payload.is_verified

        if (Object.keys(updateData).length === 1) return { success: true } // nothing to update

        const { error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', listingId)

        if (error) {
            console.error('[adminListings] update error:', error.message)
            return { success: false, error: error.message }
        }

        revalidatePath('/admin/listings')
        revalidatePath('/admin')
        revalidatePath(`/devices/${listingId}`)

        return { success: true }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'System error'
        console.error('[adminListings] unexpected error:', msg)
        return { success: false, error: msg }
    }
}

// ─────────────────────────────────────────────────────────────────
// DELETE LISTING — hard delete (admin only, no undo)
// ─────────────────────────────────────────────────────────────────
export async function actionAdminDeleteListing(
    listingId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, error: authError } = await getAdminSupabase()
        if (!supabase) return { success: false, error: authError ?? 'Unauthorized' }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', listingId)

        if (error) {
            console.error('[adminListings] delete error:', error.message)
            return { success: false, error: error.message }
        }

        revalidatePath('/admin/listings')
        revalidatePath('/admin')

        return { success: true }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'System error'
        console.error('[adminListings] delete error:', msg)
        return { success: false, error: msg }
    }
}