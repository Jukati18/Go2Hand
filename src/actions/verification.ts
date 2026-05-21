'use server'

// src/actions/verification.ts
// ─────────────────────────────────────────────────────────────────
// Server Actions for IMEI/Serial verification
//
// Why server actions (not API routes)?
//   - Called directly from the Sell Device form
//   - Keeps verification logic on the server (not exposed to client)
//   - Auto-CSRF protected by Next.js
//   - Can log verification attempts to Supabase for audit trail
// ─────────────────────────────────────────────────────────────────

import { verifyIMEI, verifySerial } from '@/lib/imeiValidator'
import type { VerificationResult } from '@/lib/imeiValidator'
import { supabase } from '@/lib/supabaseClient'

// ─────────────────────────────────────────────────────────────────
// ACTION: VERIFY IMEI
// Called from the sell form IMEI input field's "Check" button
// ─────────────────────────────────────────────────────────────────
export async function actionVerifyIMEI(
    imei: string
): Promise<VerificationResult & { success: boolean; error?: string }> {
    try {
        const result = await verifyIMEI(imei)

        // Log verification attempt to Supabase for audit trail
        // (non-blocking — we don't await this, failures don't affect the user)
        logVerificationAttempt('imei', imei, result).catch(console.error)

        return { ...result, success: true }
    } catch (err) {
        return {
            success: false,
            status: 'unverified',
            message: 'Verification service unavailable. Please try again.',
            method: 'none',
            error: err instanceof Error ? err.message : 'Unknown error',
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// ACTION: VERIFY SERIAL NUMBER
// Used for laptops, tablets, desktops — devices without IMEI
// ─────────────────────────────────────────────────────────────────
export async function actionVerifySerial(
    serial: string
): Promise<VerificationResult & { success: boolean; error?: string }> {
    try {
        const result = await verifySerial(serial)

        logVerificationAttempt('serial', serial, result).catch(console.error)

        return { ...result, success: true }
    } catch (err) {
        return {
            success: false,
            status: 'unverified',
            message: 'Verification service unavailable. Please try again.',
            method: 'none',
            error: err instanceof Error ? err.message : 'Unknown error',
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// HELPER: Log verification attempt to Supabase
//
// Table: verification_logs
// Columns: id, type, identifier_hash, status, checked_at, created_at
//
// We store a HASH of the IMEI (not the raw value) for privacy.
// Admin can still see patterns (same device checked multiple times)
// without storing the actual IMEI in plaintext logs.
// ─────────────────────────────────────────────────────────────────
async function logVerificationAttempt(
    type: 'imei' | 'serial',
    identifier: string,
    result: VerificationResult
): Promise<void> {
    // Simple hash: sum of char codes (upgrade to SHA-256 in production)
    const hash = identifier
        .split('')
        .reduce((sum, c) => sum + c.charCodeAt(0), 0)
        .toString(16)

    await supabase.from('verification_logs').insert({
        type,
        identifier_hash: hash,
        status: result.status,
        method: result.method,
        checked_at: result.checkedAt ?? new Date().toISOString(),
    })
}