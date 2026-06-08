// src/lib/supabaseClient.ts
// ─────────────────────────────────────────────────────────────────
// Supabase browser client
//
// Key config:
//  • persistSession: true  → saves tokens in localStorage
//  • autoRefreshToken: true → silently refreshes before expiry
//  • detectSessionInUrl: true → handles OAuth callback tokens
//
// Supabase JWTs expire after 1 hour by default, but the refresh
// token lasts as long as you configure in your Supabase project:
//
//   Supabase Dashboard → Auth → Settings → JWT expiry
//   → Set "Refresh Token Rotation" and duration (e.g. 14 days = 1209600 seconds)
//
// The client will automatically refresh the access token using the
// refresh token, so the user stays logged in for up to 14 days
// without being prompted again.
// ─────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnon) {
    throw new Error('❌ Missing Supabase env vars — add them to .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: {
        // Store tokens in localStorage for cross-page persistence
        persistSession: true,
        // Auto-refresh the access token before it expires (every ~55 min)
        autoRefreshToken: true,
        // Detect OAuth callback tokens in the URL hash
        detectSessionInUrl: true,
        // Use pkce flow for OAuth (more secure than implicit)
        flowType: 'pkce',
    },
})