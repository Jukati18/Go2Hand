// src/lib/supabase/server.ts
// ─────────────────────────────────────────────────────────────────
// Server-side Supabase client.
//
// Use this in:
//  • Server Components (page.tsx, layout.tsx, etc.)
//  • Server Actions ('use server')
//  • Route Handlers (app/api/**/route.ts)
//
// Do NOT use this in Client Components — use src/lib/supabase/client.ts.
// Do NOT use this in proxy.ts — the proxy builds its own inline client
// so it can forward the refreshed cookies correctly.
//
// Why async?
//   The `cookies()` function from next/headers is async in Next.js 15+.
//   All synchronous cookie access was removed in Next.js 16.
// ─────────────────────────────────────────────────────────────────
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // setAll called from a Server Component — safe to ignore.
                        // The proxy.ts handles session refresh; Server Components
                        // only need to read, not write, cookies.
                    }
                },
            },
        }
    )
}