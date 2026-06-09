// src/lib/supabaseClient.ts
// ─────────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBILITY SHIM
//
// Many existing files (AuthContext, watchlist actions, deviceService,
// etc.) import `supabase` from '@/lib/supabaseClient'.
//
// Rather than rewriting every import at once, this file re-exports
// a singleton browser client so existing code keeps working.
//
// NEW code should import from:
//   '@/lib/supabase/client'  → Client Components
//   '@/lib/supabase/server'  → Server Components / Actions / Routes
//
// The `createBrowserClient` from @supabase/ssr is the correct
// replacement for the old `createClient` from @supabase/supabase-js
// when used in a Next.js SSR context — it handles PKCE flow and
// cookie-based sessions automatically.
// ─────────────────────────────────────────────────────────────────
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnon) {
    throw new Error(
        '❌ Missing Supabase env vars.\n' +
        'Create .env.local with:\n' +
        '  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
        '  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
    )
}

// Singleton browser client — safe to share across the app.
// Uses @supabase/ssr's createBrowserClient which:
//  • Stores sessions in cookies (not localStorage) for SSR compat
//  • Uses PKCE flow by default (more secure than implicit)
//  • Auto-refreshes tokens before expiry
export const supabase = createBrowserClient(supabaseUrl, supabaseAnon)