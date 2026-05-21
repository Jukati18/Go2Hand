// src/lib/imeiValidator.ts
// ─────────────────────────────────────────────────────────────────
// IMEI & Serial Number validation utilities
//
// Layer 1: Format validation (Luhn algorithm — fully offline)
// Layer 2: Mock blacklist check (simulates real GSMA API for MVP)
//
// For production, replace mockBlacklistCheck() with a real API call:
//   - GSMA IMEI DB: https://www.gsma.com/services/fraud-security/imei-db
//   - NumVerify: https://numverify.com/documentation#imei_validate
//   - IMEI24: https://imei24.com/api
// ─────────────────────────────────────────────────────────────────

export type VerificationStatus =
    | 'clean'           // passes format + not blacklisted
    | 'flagged'         // passes format + found in blacklist
    | 'invalid_format'  // fails Luhn or wrong length
    | 'unverified'      // not checked yet (empty input)

export interface VerificationResult {
    status: VerificationStatus
    imei?: string          // normalized (digits only)
    message: string        // human-readable explanation
    checkedAt?: string     // ISO timestamp of check
    method: 'luhn' | 'mock_api' | 'none'
}

// ── IMEI format constants ─────────────────────────────────────────
const IMEI_LENGTH = 15
const SERIAL_MIN = 8
const SERIAL_MAX = 20

// ─────────────────────────────────────────────────────────────────
// LUHN ALGORITHM
//
// Standard checksum used by IMEI numbers.
// How it works:
//   1. From right to left, double every second digit
//   2. If doubled value > 9, subtract 9
//   3. Sum all digits — must be divisible by 10
//
// Example: IMEI 490154203237518
//   Digits:   4  9  0  1  5  4  2  0  3  2  3  7  5  1  8
//   Double→   4 18  0  2  5  8  2  0  3  4  3 14  5  2  8
//   >9 fix:   4  9  0  2  5  8  2  0  3  4  3  5  5  2  8
//   Sum = 60 → 60 % 10 === 0 ✓ VALID
// ─────────────────────────────────────────────────────────────────
export function luhnCheck(input: string): boolean {
    const digits = input.replace(/\D/g, '')
    if (digits.length === 0) return false

    let sum = 0
    let shouldDouble = false

    // Traverse from right to left
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10)

        if (shouldDouble) {
            digit *= 2
            if (digit > 9) digit -= 9
        }

        sum += digit
        shouldDouble = !shouldDouble
    }

    return sum % 10 === 0
}

// ─────────────────────────────────────────────────────────────────
// NORMALIZE IMEI
// Strips spaces, dashes, dots — sellers often copy-paste with separators
// e.g. "490154-20-323751-8" → "490154203237518"
// ─────────────────────────────────────────────────────────────────
export function normalizeIMEI(raw: string): string {
    return raw.replace(/[\s\-\.]/g, '')
}

// ─────────────────────────────────────────────────────────────────
// VALIDATE IMEI FORMAT
// Returns true only if 15 digits AND passes Luhn
// ─────────────────────────────────────────────────────────────────
export function isValidIMEIFormat(raw: string): boolean {
    const normalized = normalizeIMEI(raw)
    if (normalized.length !== IMEI_LENGTH) return false
    if (!/^\d+$/.test(normalized)) return false
    return luhnCheck(normalized)
}

// ─────────────────────────────────────────────────────────────────
// VALIDATE SERIAL NUMBER FORMAT
// Alphanumeric, 8–20 characters
// Apple serials: 12 chars (C02XN0AFJG5M)
// Samsung serials: 11–15 chars (R58N60TKJ5X)
// ─────────────────────────────────────────────────────────────────
export function isValidSerialFormat(raw: string): boolean {
    const normalized = raw.trim().toUpperCase()
    if (normalized.length < SERIAL_MIN || normalized.length > SERIAL_MAX) return false
    return /^[A-Z0-9]+$/.test(normalized)
}

// ─────────────────────────────────────────────────────────────────
// MOCK BLACKLIST CHECK
//
// Simulates an async API call to a stolen-device database.
// Logic:
//   - A small set of hard-coded "flagged" IMEIs for demo
//   - Deterministic: same IMEI always returns the same result
//   - Uses the Luhn checksum remainder as a probability signal
//     so ~5% of random valid IMEIs get flagged (realistic rate)
//
// Replace this with a real API call in production.
// ─────────────────────────────────────────────────────────────────

// These specific IMEIs are always flagged — useful for testing
const DEMO_FLAGGED_IMEIS = new Set([
    '352099001761481', // Use this in your test form to see "flagged" state
    '013468001234565',
    '356938035643809',
])

// These specific serials are always flagged
const DEMO_FLAGGED_SERIALS = new Set([
    'STOLEN123456',
    'BLACKLIST999',
])

async function mockBlacklistCheck(
    identifier: string,
    type: 'imei' | 'serial'
): Promise<'clean' | 'flagged'> {
    // Simulate network latency (300–800ms)
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500))

    // Check hard-coded demo flagged list first
    if (type === 'imei' && DEMO_FLAGGED_IMEIS.has(identifier)) return 'flagged'
    if (type === 'serial' && DEMO_FLAGGED_SERIALS.has(identifier.toUpperCase())) return 'flagged'

    // For IMEI: use digit sum modulo to deterministically flag ~5% of IMEIs
    // This ensures the same IMEI always returns the same result across page loads
    if (type === 'imei') {
        const digitSum = identifier.split('').reduce((sum, d) => sum + parseInt(d, 10), 0)
        if (digitSum % 20 === 0) return 'flagged' // exactly 5% of valid IMEIs
    }

    // For serial: flag if sum of char codes mod 17 === 0 (~6%)
    if (type === 'serial') {
        const charSum = identifier.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
        if (charSum % 17 === 0) return 'flagged'
    }

    return 'clean'
}

// ─────────────────────────────────────────────────────────────────
// VERIFY IMEI (main public function)
//
// Full two-layer verification:
//   1. Format check (Luhn) — instant
//   2. Mock blacklist check — async (simulates API)
// ─────────────────────────────────────────────────────────────────
export async function verifyIMEI(raw: string): Promise<VerificationResult> {
    if (!raw.trim()) {
        return {
            status: 'unverified',
            message: 'No IMEI provided',
            method: 'none',
        }
    }

    const normalized = normalizeIMEI(raw)

    // Layer 1: Format validation
    if (normalized.length !== IMEI_LENGTH) {
        return {
            status: 'invalid_format',
            message: `IMEI must be exactly ${IMEI_LENGTH} digits (got ${normalized.length})`,
            method: 'luhn',
        }
    }

    if (!/^\d+$/.test(normalized)) {
        return {
            status: 'invalid_format',
            message: 'IMEI must contain only digits',
            method: 'luhn',
        }
    }

    if (!luhnCheck(normalized)) {
        return {
            status: 'invalid_format',
            message: 'IMEI checksum is invalid — please double-check the number',
            method: 'luhn',
        }
    }

    // Layer 2: Mock blacklist check
    const blacklistResult = await mockBlacklistCheck(normalized, 'imei')

    return {
        status: blacklistResult,
        imei: normalized,
        message: blacklistResult === 'clean'
            ? 'IMEI verified — not reported stolen or blacklisted'
            : 'IMEI flagged — reported as stolen or blacklisted. Do not proceed.',
        checkedAt: new Date().toISOString(),
        method: 'mock_api',
    }
}

// ─────────────────────────────────────────────────────────────────
// VERIFY SERIAL (for laptops, tablets, desktops, watches)
// ─────────────────────────────────────────────────────────────────
export async function verifySerial(raw: string): Promise<VerificationResult> {
    if (!raw.trim()) {
        return {
            status: 'unverified',
            message: 'No serial number provided',
            method: 'none',
        }
    }

    const normalized = raw.trim().toUpperCase()

    // Format check
    if (!isValidSerialFormat(normalized)) {
        return {
            status: 'invalid_format',
            message: `Serial must be ${SERIAL_MIN}–${SERIAL_MAX} alphanumeric characters`,
            method: 'luhn',
        }
    }

    // Mock blacklist check
    const blacklistResult = await mockBlacklistCheck(normalized, 'serial')

    return {
        status: blacklistResult,
        message: blacklistResult === 'clean'
            ? 'Serial number verified — not reported stolen or blacklisted'
            : 'Serial number flagged — reported as stolen. Do not proceed.',
        checkedAt: new Date().toISOString(),
        method: 'mock_api',
    }
}