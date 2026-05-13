'use server'

// ============================================
// WATCHLIST SERVER ACTIONS
//
// The watchlist (saved devices) lets buyers
// bookmark devices they're interested in.
// Table: watchlist (id, user_id, product_id, created_at)
// ============================================

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'

async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD to watchlist
// Returns { success, alreadySaved } — "alreadySaved" lets the UI
// show the correct state without a separate check call.
// ─────────────────────────────────────────────────────────────────────────────
export async function actionAddToWatchlist(
    productId: string
): Promise<{ success: boolean; alreadySaved?: boolean; error?: string }> {
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in to save devices' }
    }

    try {
        // upsert = insert OR ignore if already exists (no duplicate rows)
        const { error } = await supabase
            .from('watchlist')
            .upsert(
                { user_id: userId, product_id: productId },
                { onConflict: 'user_id,product_id', ignoreDuplicates: true }
            )

        if (error) throw new Error(error.message)

        revalidatePath('/watchlist')
        revalidatePath(`/devices/${productId}`)

        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOVE from watchlist
// ─────────────────────────────────────────────────────────────────────────────
export async function actionRemoveFromWatchlist(
    productId: string
): Promise<{ success: boolean; error?: string }> {
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in' }
    }

    try {
        const { error } = await supabase
            .from('watchlist')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId)

        if (error) throw new Error(error.message)

        revalidatePath('/watchlist')
        revalidatePath(`/devices/${productId}`)

        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK if a specific device is in the user's watchlist
// Used to show the filled/unfilled heart icon on the detail page
// ─────────────────────────────────────────────────────────────────────────────
export async function isInWatchlist(productId: string): Promise<boolean> {
    const userId = await getCurrentUserId()
    if (!userId) return false

    const { data } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle()   // returns null instead of error if not found

    return data !== null
}

// ─────────────────────────────────────────────────────────────────────────────
// GET all watchlist entries for the current user
// Joins with products so we get full device info
// ─────────────────────────────────────────────────────────────────────────────
export async function getWatchlist() {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const { data, error } = await supabase
        .from('watchlist')
        .select(`
      id,
      created_at,
      product:products (
        id, title, price, original_price, condition,
        images, storage_capacity, color, battery_health,
        status, is_verified,
        brand:brands ( name ),
        category:categories ( name )
      )
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('getWatchlist:', error.message)
        return []
    }

    // Filter out products that were deleted/sold (status not active)
    return (data ?? []).filter(
        (entry) => (entry.product as any)?.status === 'active'
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE — single action for the heart button (add if not saved, remove if saved)
// Returns the new saved state so the UI can update instantly
// ─────────────────────────────────────────────────────────────────────────────
export async function actionToggleWatchlist(
    productId: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, isSaved: false, error: 'Login required' }
    }

    // Check current state first
    const saved = await isInWatchlist(productId)

    if (saved) {
        const result = await actionRemoveFromWatchlist(productId)
        return { ...result, isSaved: false }
    } else {
        const result = await actionAddToWatchlist(productId)
        return { ...result, isSaved: true }
    }
}