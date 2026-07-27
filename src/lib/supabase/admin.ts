// src/lib/supabase/admin.ts
//
// SERVICE ROLE CLIENT — bypasses RLS entirely.
//
// Use ONLY in trusted server-only code that has already verified
// the caller's identity itself (checkout route after auth.getUser(),
// Stripe webhooks verified by signature, cron jobs verified by
// CRON_SECRET). NEVER import this in a Client Component or expose
// the key with a NEXT_PUBLIC_ prefix.
//
// LAZY INIT — WHY:
//   Next.js's `next build` "Collecting page data" step imports every
//   route module that transitively imports this file (checkout,
//   webhooks, cron, sitemap.ts, admin actions, etc.) purely to
//   statically analyze them — no Supabase call is ever made during
//   that step. The old top-level `createClient(...)` call threw
//   immediately if SUPABASE_SERVICE_ROLE_KEY was missing from the
//   build environment, crashing the entire build even for routes
//   that never touch Supabase during that phase. This Proxy defers
//   both client construction and the missing-key check until a
//   Supabase method is actually called at runtime — every existing
//   call site (`supabaseAdmin.from(...)`, etc.) keeps working
//   unchanged.

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdminInstance(): SupabaseClient {
    if (_supabaseAdmin) return _supabaseAdmin

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error(
            'NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
            'Set both in .env.local for local dev, or in your deployment/CI ' +
            'platform\'s environment variables (Vercel → Project Settings → ' +
            'Environment Variables, or GitHub → Settings → Secrets and ' +
            'variables → Actions) before any code path that actually queries ' +
            'Supabase with admin privileges runs.'
        )
    }

    _supabaseAdmin = createClient(url, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    return _supabaseAdmin
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        const instance = getSupabaseAdminInstance()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (instance as any)[prop]
        return typeof value === 'function' ? value.bind(instance) : value
    },
})