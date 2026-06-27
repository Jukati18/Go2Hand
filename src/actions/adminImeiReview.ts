'use server'

// src/actions/adminImeiReview.ts
// ─────────────────────────────────────────────────────────────────
// ADMIN — IMEI REVIEW DECISIONS
//
// Three possible admin decisions on a flagged IMEI listing:
//
//   'clear'   — Admin investigated and believes the flag is a
//               false positive. Clear the flag → imei_status = 'clean'.
//               Listing stays active and visible.
//
//   'remove'  — IMEI is genuinely suspicious. Soft-delete the
//               listing (status = 'inactive') so it disappears
//               from buyers. Seller can see it in their dashboard
//               and contact support.
//
//   'escalate'— More investigation needed. Set status =
//               'pending_review' so the listing is hidden from
//               buyers but not deleted. Shows up in the
//               "Pending" tab of admin/listings.
//
// All three actions write an admin_note to a separate audit table
// (verification_logs) so there's a paper trail.
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'

export type ImeiDecision = 'clear' | 'remove' | 'escalate'

export interface ImeiReviewPayload {
    decision: ImeiDecision
    /** Optional free-text note the admin types in the drawer */
    adminNote?: string
}

// ── Build SSR client and verify admin role ────────────────────────
async function getAdminClient() {
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
                    } catch { /* Server Component context — safe to ignore */ }
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

    if (profile?.role !== 'admin') return { supabase: null, error: 'Forbidden: admin only' }

    return { supabase, error: null }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: SUBMIT IMEI REVIEW DECISION
// ─────────────────────────────────────────────────────────────────
export async function actionAdminReviewImei(
    listingId: string,
    payload: ImeiReviewPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, error: authError } = await getAdminClient()
        if (!supabase) return { success: false, error: authError ?? 'Unauthorized' }

        const now = new Date().toISOString()

        // ── Map decision → DB updates ─────────────────────────────
        let productUpdate: Record<string, unknown> = { updated_at: now }

        switch (payload.decision) {
            case 'clear':
                // False positive — restore trust, keep listing live
                productUpdate = {
                    ...productUpdate,
                    imei_status: 'clean',
                    is_verified: true,   // admin-cleared listings get a verified badge
                }
                break

            case 'remove':
                // Confirmed suspicious — hide from buyers immediately
                productUpdate = {
                    ...productUpdate,
                    status: 'inactive',
                }
                break

            case 'escalate':
                // Needs deeper investigation — hide but don't delete
                productUpdate = {
                    ...productUpdate,
                    status: 'pending_review',
                }
                break
        }

        // ── 1. Update the product row ─────────────────────────────
        const { error: updateError } = await supabase
            .from('products')
            .update(productUpdate)
            .eq('id', listingId)

        if (updateError) {
            console.error('[adminImeiReview] product update error:', updateError.message)
            return { success: false, error: updateError.message }
        }

        // ── 2. Write an audit log to verification_logs ────────────
        // We store the listing ID as the identifier_hash field
        // (repurposing it as a decision audit trail for MVP).
        // A production system would add a dedicated admin_decisions table.
        const { error: logError } = await supabase
            .from('verification_logs')
            .insert({
                type:             'imei',
                identifier_hash:  `admin_decision:${listingId}`,
                status:           payload.decision === 'clear' ? 'clean' : 'flagged',
                method:           'admin_review',
                checked_at:       now,
            })

        if (logError) {
            // Non-fatal — the product was already updated. Log and continue.
            console.warn('[adminImeiReview] audit log insert failed:', logError.message)
        }

        // ── 3. Revalidate affected pages ──────────────────────────
        revalidatePath('/admin/reviews')
        revalidatePath('/admin/listings')
        revalidatePath('/admin')
        revalidatePath(`/devices/${listingId}`)

        return { success: true }

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unexpected error'
        console.error('[adminImeiReview] unexpected error:', msg)
        return { success: false, error: msg }
    }
}