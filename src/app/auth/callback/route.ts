// src/app/auth/callback/route.ts
// ─────────────────────────────────────────────────────────────────
// Supabase OAuth callback handler
//
// After Google (or any OAuth provider) redirects back, Supabase
// appends a one-time ?code= to the URL. This route exchanges it
// for a real session and sets the session cookie, then redirects
// the user to wherever they came from (the ?next= param, or /).
//
// The redirectTo URL in signInWithGoogle() must point here:
//   `${window.location.origin}/auth/callback`
//
// And this URL must be in your Supabase project's
//   Auth → URL Configuration → Redirect URLs allowlist.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)

    const code = searchParams.get('code')
    // ?next= is forwarded from the original login redirect
    const next = searchParams.get('next') ?? '/'

    if (!code) {
        // No code — something went wrong in the OAuth flow
        console.error('[auth/callback] Missing ?code param')
        return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                },
            },
        }
    )

    // Exchange the one-time code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error('[auth/callback] Code exchange failed:', error.message)
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(error.message)}`
        )
    }

    // ── Create profile row for new Google users ───────────────────
    // If this is the user's first OAuth sign-in, Supabase creates
    // the auth record but NOT our `users` table row (that's our job).
    if (data.user) {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle()

        if (!existing) {
            // Derive a username from the Google display name or email prefix
            const rawName =
                data.user.user_metadata?.full_name ??
                data.user.email?.split('@')[0] ??
                'user'
            // Sanitize: keep only alphanumeric + underscore, limit to 20 chars
            const username = rawName
                .replace(/[^a-zA-Z0-9_]/g, '_')
                .slice(0, 20)

            await supabase.from('users').insert({
                id:         data.user.id,
                email:      data.user.email,
                username,
                avatar_url: data.user.user_metadata?.avatar_url ?? null,
                role:       'buyer',
            })
        }
    }

    // Redirect to original destination (or home)
    return NextResponse.redirect(`${origin}${next}`)
}