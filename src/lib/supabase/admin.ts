// src/lib/supabase/admin.ts
//
// SERVICE ROLE CLIENT — bypasses RLS entirely.
//
// Use ONLY in trusted server-only code that has already verified
// the caller's identity itself (checkout route after auth.getUser(),
// Stripe webhooks verified by signature, cron jobs verified by
// CRON_SECRET). NEVER import this in a Client Component or expose
// the key with a NEXT_PUBLIC_ prefix.

import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)