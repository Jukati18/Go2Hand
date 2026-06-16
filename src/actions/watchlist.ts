'use server'

// ============================================
// WATCHLIST SERVER ACTIONS
// Table: watchlist (id, user_id, product_id, created_at)
// ============================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Returns a request-scoped Supabase client + the current user's id.
// Every function below uses THIS client, not a global singleton.
async function getCurrentUserClient() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return { supabase, userId: user?.id ?? null }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD to watchlist
// ─────────────────────────────────────────────────────────────────────────────
export async function actionAddToWatchlist(
    productId: string
): Promise<{ success: boolean; alreadySaved?: boolean; error?: string }> {
    const { supabase, userId } = await getCurrentUserClient()
    if (!userId) {
        return { success: false, error: 'You must be logged in to save devices' }
    }

    try {
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
    const { supabase, userId } = await getCurrentUserClient()
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
// ─────────────────────────────────────────────────────────────────────────────
export async function isInWatchlist(productId: string): Promise<boolean> {
    const { supabase, userId } = await getCurrentUserClient()
    if (!userId) return false

    const { data } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle()

    return data !== null
}

// ─────────────────────────────────────────────────────────────────────────────
// GET all watchlist entries for the current user
// ─────────────────────────────────────────────────────────────────────────────
export async function getWatchlist() {
    const { supabase, userId } = await getCurrentUserClient()
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

    return (data ?? []).filter(
        (entry) => (entry.product as any)?.status === 'active'
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE — single action for the heart button
// ─────────────────────────────────────────────────────────────────────────────
export async function actionToggleWatchlist(
    productId: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
    const { userId } = await getCurrentUserClient()
    if (!userId) {
        return { success: false, isSaved: false, error: 'Login required' }
    }

    const saved = await isInWatchlist(productId)

    if (saved) {
        const result = await actionRemoveFromWatchlist(productId)
        return { ...result, isSaved: false }
    } else {
        const result = await actionAddToWatchlist(productId)
        return { ...result, isSaved: true }
    }
}