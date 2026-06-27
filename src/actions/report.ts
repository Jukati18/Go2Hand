'use server'

// src/actions/report.ts
// ─────────────────────────────────────────────────────────────────
// USER-FACING REPORT ACTIONS
//
// Any authenticated user can submit a report on:
//   • A device listing  (reportType = 'listing')
//   • Another user      (reportType = 'user')
//
// Reports are stored in the `reports` table and surfaced in the
// admin /admin/reports queue. Duplicate reports (same reporter,
// same target, within 24h) are silently de-duped to prevent spam.
//
// DB table expected:
//   reports (
//     id            uuid pk default gen_random_uuid(),
//     reporter_id   uuid references users(id),
//     target_type   text  -- 'listing' | 'user'
//     target_id     uuid  -- products.id OR users.id
//     reason        text  -- 'spam' | 'counterfeit' | 'scam' | 'inappropriate' | 'other'
//     details       text  -- optional free text
//     status        text  -- 'pending' | 'reviewed' | 'dismissed'
//     created_at    timestamptz default now()
//   )
// ─────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ReportTargetType = 'listing' | 'user'
export type ReportReason =
    | 'spam'
    | 'counterfeit'
    | 'scam'
    | 'stolen_device'
    | 'inappropriate'
    | 'offensive_content'
    | 'wrong_category'
    | 'other'

export interface SubmitReportInput {
    targetType: ReportTargetType
    targetId: string
    reason: ReportReason
    details?: string
}

type ActionResult = { success: boolean; error?: string }

// ── Human-readable labels used in the UI ─────────────────────────
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
    spam:               'Spam or duplicate listing',
    counterfeit:        'Counterfeit / fake product',
    scam:               'Suspected scam',
    stolen_device:      'Stolen device',
    inappropriate:      'Inappropriate content',
    offensive_content:  'Offensive or harmful content',
    wrong_category:     'Wrong category / misleading info',
    other:              'Other',
}

// ─────────────────────────────────────────────────────────────────
// ACTION: SUBMIT REPORT
// ─────────────────────────────────────────────────────────────────
export async function actionSubmitReport(
    input: SubmitReportInput
): Promise<ActionResult> {
    const supabase = await createClient()

    // Auth guard
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'You must be logged in to report content' }

    // Prevent self-reporting
    if (input.targetType === 'user' && input.targetId === user.id) {
        return { success: false, error: 'You cannot report yourself' }
    }

    // Validate reason
    if (!Object.keys(REPORT_REASON_LABELS).includes(input.reason)) {
        return { success: false, error: 'Invalid report reason' }
    }

    try {
        // De-dup: check if this user already reported this target in the last 24h
        const { data: existing } = await supabase
            .from('reports')
            .select('id')
            .eq('reporter_id', user.id)
            .eq('target_id', input.targetId)
            .eq('target_type', input.targetType)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle()

        if (existing) {
            // Silent success — user already reported this, no need to tell them
            return { success: true }
        }

        const { error } = await supabase.from('reports').insert({
            reporter_id:  user.id,
            target_type:  input.targetType,
            target_id:    input.targetId,
            reason:       input.reason,
            details:      input.details?.trim() || null,
            status:       'pending',
        })

        if (error) throw new Error(error.message)

        // Revalidate admin report queue
        revalidatePath('/admin/reports')

        return { success: true }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to submit report'
        console.error('[report] submit error:', msg)
        return { success: false, error: msg }
    }
}