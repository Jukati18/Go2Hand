'use server'

// src/actions/adminReports.ts
// ─────────────────────────────────────────────────────────────────
// ADMIN — REPORT MODERATION ACTIONS
//
// Admins take one of three actions on each report:
//   'dismiss'  — not a real violation, close the report
//   'warn'     — send a warning, mark report reviewed
//   'ban'      — suspend/ban the reported user or remove the listing
//
// Ban levels (for users):
//   'temporary'  — sets banned_until (e.g. 7 or 30 days)
//   'permanent'  — sets banned_until = far future + is_banned = true
//
// DB columns needed on users table:
//   is_banned   boolean default false
//   banned_at   timestamptz
//   banned_reason text
//   ban_type    text ('temporary' | 'permanent')
//   banned_until timestamptz  -- null = permanent
//
// All decisions are recorded back on the reports row.
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'

export type ReportDecision = 'dismiss' | 'warn' | 'ban_listing' | 'ban_user_7d' | 'ban_user_30d' | 'ban_user_permanent'

export interface AdminReportActionPayload {
    decision: ReportDecision
    /** Internal note for the audit trail */
    adminNote?: string
}

// ── Build SSR client + verify admin ──────────────────────────────
async function getAdminClient() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c) => {
                    try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
                    catch { /* Server Component context */ }
                },
            },
        }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null, adminId: null, error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'admin') return { supabase: null, adminId: null, error: 'Forbidden' }

    return { supabase, adminId: user.id, error: null }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: RESOLVE REPORT
// ─────────────────────────────────────────────────────────────────
export async function actionAdminResolveReport(
    reportId: string,
    payload: AdminReportActionPayload
): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, error: authError } = await getAdminClient()
        if (!supabase) return { success: false, error: authError ?? 'Unauthorized' }

        const now = new Date().toISOString()

        // 1. Fetch the report to know what we're acting on
        const { data: report, error: fetchErr } = await supabase
            .from('reports')
            .select('id, target_type, target_id, status')
            .eq('id', reportId)
            .single()

        if (fetchErr || !report) return { success: false, error: 'Report not found' }
        if (report.status === 'reviewed') return { success: false, error: 'Report already resolved' }

        const { decision, adminNote } = payload

        // 2. Apply the decision to the target
        if (decision === 'ban_listing') {
            // Hide the listing
            await supabase
                .from('products')
                .update({ status: 'inactive', updated_at: now })
                .eq('id', report.target_id)
        }

        if (decision.startsWith('ban_user')) {
            // Calculate the ban duration
            let bannedUntil: string | null = null
            let banType: 'temporary' | 'permanent' = 'temporary'

            if (decision === 'ban_user_7d') {
                bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            } else if (decision === 'ban_user_30d') {
                bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            } else if (decision === 'ban_user_permanent') {
                banType = 'permanent'
                bannedUntil = null // null = permanent
            }

            const targetUserId = report.target_type === 'user'
                ? report.target_id
                : null // for listing reports, we'd need to look up the seller

            // If report is on a listing, find the seller
            let userToBan = targetUserId
            if (!userToBan && report.target_type === 'listing') {
                const { data: product } = await supabase
                    .from('products').select('seller_id').eq('id', report.target_id).single()
                userToBan = product?.seller_id ?? null
            }

            if (userToBan) {
                await supabase
                    .from('users')
                    .update({
                        is_banned:     true,
                        banned_at:     now,
                        banned_reason: adminNote ?? `Banned following report #${reportId.slice(0, 8)}`,
                        ban_type:      banType,
                        banned_until:  bannedUntil,
                        updated_at:    now,
                    })
                    .eq('id', userToBan)

                // Also deactivate all their listings
                if (banType === 'permanent' || decision === 'ban_user_30d') {
                    await supabase
                        .from('products')
                        .update({ status: 'inactive', updated_at: now })
                        .eq('seller_id', userToBan)
                        .eq('status', 'active')
                }
            }
        }

        // 3. Mark the report as reviewed
        const { error: updateErr } = await supabase
            .from('reports')
            .update({
                status:      decision === 'dismiss' ? 'dismissed' : 'reviewed',
                admin_note:  adminNote ?? null,
                reviewed_at: now,
                decision,
            })
            .eq('id', reportId)

        if (updateErr) throw new Error(updateErr.message)

        revalidatePath('/admin/reports')
        revalidatePath('/admin')
        revalidatePath('/admin/users')
        revalidatePath('/admin/listings')

        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error'
        console.error('[adminReports] resolve error:', msg)
        return { success: false, error: msg }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: BAN USER DIRECTLY (from user management page)
// ─────────────────────────────────────────────────────────────────
export async function actionAdminBanUser(
    targetUserId: string,
    payload: {
        banType: 'temporary_7d' | 'temporary_30d' | 'permanent'
        reason: string
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, error: authError } = await getAdminClient()
        if (!supabase) return { success: false, error: authError ?? 'Unauthorized' }

        const now = new Date().toISOString()

        let bannedUntil: string | null = null
        const banType = payload.banType === 'permanent' ? 'permanent' : 'temporary'

        if (payload.banType === 'temporary_7d') {
            bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } else if (payload.banType === 'temporary_30d') {
            bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        const { error } = await supabase
            .from('users')
            .update({
                is_banned:     true,
                banned_at:     now,
                banned_reason: payload.reason.trim() || 'Policy violation',
                ban_type:      banType,
                banned_until:  bannedUntil,
                updated_at:    now,
            })
            .eq('id', targetUserId)

        if (error) throw new Error(error.message)

        // Deactivate active listings on 30d or permanent ban
        if (payload.banType !== 'temporary_7d') {
            await supabase
                .from('products')
                .update({ status: 'inactive', updated_at: now })
                .eq('seller_id', targetUserId)
                .eq('status', 'active')
        }

        revalidatePath('/admin/users')
        revalidatePath('/admin')

        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error'
        return { success: false, error: msg }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: UNBAN USER
// ─────────────────────────────────────────────────────────────────
export async function actionAdminUnbanUser(
    targetUserId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, error: authError } = await getAdminClient()
        if (!supabase) return { success: false, error: authError ?? 'Unauthorized' }

        const { error } = await supabase
            .from('users')
            .update({
                is_banned:     false,
                banned_at:     null,
                banned_reason: null,
                ban_type:      null,
                banned_until:  null,
                updated_at:    new Date().toISOString(),
            })
            .eq('id', targetUserId)

        if (error) throw new Error(error.message)

        revalidatePath('/admin/users')
        revalidatePath('/admin')

        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error'
        return { success: false, error: msg }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: FLAG LISTING (admin directly flags something suspicious)
// ─────────────────────────────────────────────────────────────────
export async function actionAdminFlagListing(
    listingId: string,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { supabase, adminId, error: authError } = await getAdminClient()
        if (!supabase || !adminId) return { success: false, error: authError ?? 'Unauthorized' }

        const { error } = await supabase.from('reports').insert({
            reporter_id:  adminId,
            target_type:  'listing',
            target_id:    listingId,
            reason:       'other',
            details:      reason.trim() || 'Flagged by admin',
            status:       'pending',
        })

        if (error) throw new Error(error.message)

        // Also set listing to pending_review so it's hidden from buyers
        await supabase
            .from('products')
            .update({ status: 'pending_review', updated_at: new Date().toISOString() })
            .eq('id', listingId)

        revalidatePath('/admin/reports')
        revalidatePath('/admin/listings')

        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unexpected error'
        return { success: false, error: msg }
    }
}