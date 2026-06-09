// src/lib/supabase/client.ts
// ─────────────────────────────────────────────────────────────────
// Browser-side Supabase client.
//
// Use this in:
//  • Client Components ('use client')
//  • AuthContext, CartContext, etc.
//  • Any hook that runs in the browser
//
// Do NOT use this in Server Components, Server Actions, or proxy.ts.
// Those should use src/lib/supabase/server.ts instead.
// ─────────────────────────────────────────────────────────────────
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}