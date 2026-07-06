'use server'

// src/actions/verification.ts
// ─────────────────────────────────────────────────────────────────
// Server Actions for IMEI/Serial verification
//
// SECURITY FIX (Week 12 audit): the old hash used a char-code sum,
// which is trivially reversible and offers no real protection for
// identity-sensitive data like IMEI/serial numbers. Replaced with
// SHA-256 via Node's built-in `crypto` module — a proper one-way
// cryptographic hash. We also salt with an env-stored pepper so the
// hash can't be brute-forced via a precomputed IMEI rainbow table
// even if the verification_logs table is ever exposed.
// ─────────────────────────────────────────────────────────────────

import { createHash } from 'crypto'
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
// HELPER: Hash an identifier with SHA-256 (+ pepper)
//
// SECURITY: VERIFICATION_HASH_PEPPER must be set in your environment
// (.env.local for dev, Vercel env vars for production). It's a
// server-only secret — never prefix it with NEXT_PUBLIC_. Generate
// one with: `openssl rand -hex 32`
//
// Without a pepper, anyone with DB read access could brute-force
// IMEIs (15-digit numeric space) against the stored hashes. The
// pepper makes that infeasible without also leaking the env var.
// ─────────────────────────────────────────────────────────────────
function hashIdentifier(identifier: string): string {
    const pepper = process.env.VERIFICATION_HASH_PEPPER
    if (!pepper) {
        // Fail loudly in dev so this is never silently weak in prod.
        throw new Error(
            'VERIFICATION_HASH_PEPPER is not set — add it to your environment ' +
            '(generate with `openssl rand -hex 32`) before logging verification attempts.'
        )
    }
    return createHash('sha256')
        .update(`${pepper}:${identifier}`)
        .digest('hex')
}

// ─────────────────────────────────────────────────────────────────
// HELPER: Log verification attempt to Supabase
//
// Table: verification_logs
// Columns: id, type, identifier_hash, status, checked_at, created_at
//
// We store a SHA-256 HASH of the IMEI/serial (never the raw value)
// for privacy. Admin can still see patterns (same device checked
// multiple times) without storing the actual identifier in plaintext.
// ─────────────────────────────────────────────────────────────────
async function logVerificationAttempt(
    type: 'imei' | 'serial',
    identifier: string,
    result: VerificationResult
): Promise<void> {
    let hash: string
    try {
        hash = hashIdentifier(identifier)
    } catch (err) {
        // Don't let a missing pepper crash the verification flow for
        // the user — just skip the audit log and surface it in logs.
        console.error('[verification] Failed to hash identifier for audit log:', err)
        return
    }

    await supabase.from('verification_logs').insert({
        type,
        identifier_hash: hash,
        status: result.status,
        method: result.method,
        checked_at: result.checkedAt ?? new Date().toISOString(),
    })
}