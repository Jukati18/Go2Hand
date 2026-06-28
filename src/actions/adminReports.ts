'use server'

// src/actions/adminReports.ts
// ─────────────────────────────────────────────────────────────────
// ADMIN — REPORT MODERATION ACTIONS
//
// Decisions:
//   'dismiss'            — not a real violation, close the report
//   'warn'               — note the warning internally, mark reviewed
//   'ban_listing'        — soft-delete the listing (status = 'inactive')
//   'ban_user_7d'        — suspend for 7 days
//   'ban_user_30d'       — suspend for 30 days
//   'ban_user_permanent' — permanent ban
//
// All decisions record the decision + admin_note back on the report row.
// Ban decisions also update the users table (is_banned, banned_until, etc.)
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'

export type ReportDecision =
    | 'dismiss'
    | 'warn'
    | 'ban_listing'
    | 'ban_user_7d'
    | 'ban_user_30d'
    | 'ban_user_permanent'

export interface AdminReportActionPayload {
    decision: ReportDecision
    adminNote?: string
}

// ── Build SSR Supabase client and verify admin role ───────────────
async function getAdminClient() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c) => {
                    try {
                        c.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        /* Server Component context */
                    }
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { supabase: null, error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { supabase: null, error: 'Forbidden' }

    return { supabase, error: null }
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
        const { decision, adminNote } = payload

        // 1. Fetch the report to know the target
        const { data: report, error: fetchErr } = await supabase
            .from('reports')
            .select('id, target_type, target_id, status')
            .eq('id', reportId)
            .single()

        if (fetchErr || !report) return { success: false, error: 'Report not found' }
        if (report.status === 'reviewed') {
            return { success: false, error: 'Report already resolved' }
        }

        // 2. Apply side effects based on decision
        if (decision === 'ban_listing') {
            // Hide the listing from the marketplace immediately
            await supabase
                .from('products')
                .update({ status: 'inactive', updated_at: now })
                .eq('id', report.target_id)
        }

        if (decision.startsWith('ban_user')) {
            // Resolve which user to ban:
            //   - For user reports → target_id IS the user
            //   - For listing reports → look up the seller
            let userToBan: string | null = null

            if (report.target_type === 'user') {
                userToBan = report.target_id
            } else {
                // listing report → ban the seller
                const { data: product } = await supabase
                    .from('products')
                    .select('seller_id')
                    .eq('id', report.target_id)
                    .single()
                userToBan = product?.seller_id ?? null
            }

            if (userToBan) {
                // Calculate ban duration
                let bannedUntil: string | null = null
                let banType: 'temporary' | 'permanent' = 'temporary'

                if (decision === 'ban_user_7d') {
                    bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                } else if (decision === 'ban_user_30d') {
                    bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                } else {
                    // permanent
                    banType = 'permanent'
                    bannedUntil = null
                }

                await supabase
                    .from('users')
                    .update({
                        is_banned: true,
                        banned_at: now,
                        banned_reason: adminNote?.trim() || `Banned following report #${reportId.slice(0, 8)}`,
                        ban_type: banType,
                        banned_until: bannedUntil,
                        updated_at: now,
                    })
                    .eq('id', userToBan)

                // On 30d or permanent ban, also hide all their active listings
                if (decision !== 'ban_user_7d') {
                    await supabase
                        .from('products')
                        .update({ status: 'inactive', updated_at: now })
                        .eq('seller_id', userToBan)
                        .eq('status', 'active')
                }
            }
        }

        // 3. Mark the report resolved
        const newStatus = decision === 'dismiss' ? 'dismissed' : 'reviewed'

        const { error: updateErr } = await supabase
            .from('reports')
            .update({
                status: newStatus,
                decision,
                admin_note: adminNote?.trim() || null,
                reviewed_at: now,
                updated_at: now,
            })
            .eq('id', reportId)

        if (updateErr) throw new Error(updateErr.message)

        // Revalidate all affected admin pages
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
        const isPermanent = payload.banType === 'permanent'
        const banType = isPermanent ? 'permanent' : 'temporary'

        let bannedUntil: string | null = null
        if (payload.banType === 'temporary_7d') {
            bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } else if (payload.banType === 'temporary_30d') {
            bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        const { error } = await supabase
            .from('users')
            .update({
                is_banned: true,
                banned_at: now,
                banned_reason: payload.reason.trim() || 'Policy violation',
                ban_type: banType,
                banned_until: bannedUntil,
                updated_at: now,
            })
            .eq('id', targetUserId)

        if (error) throw new Error(error.message)

        // Deactivate listings on 30d or permanent bans
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
                is_banned: false,
                banned_at: null,
                banned_reason: null,
                ban_type: null,
                banned_until: null,
                updated_at: new Date().toISOString(),
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