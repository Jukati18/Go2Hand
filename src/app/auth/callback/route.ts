// src/app/auth/callback/route.ts
// ─────────────────────────────────────────────────────────────────
// Supabase OAuth + email magic-link callback handler.
//
// After Google (or any OAuth provider / email link) redirects back,
// Supabase appends a one-time ?code= to the URL. This route:
//  1. Exchanges the code for a real session (sets the cookie)
//  2. Creates a profile row for first-time OAuth users
//  3. Redirects to ?next= or /
//
// The redirectTo URL in signInWithOAuth() must point here and be
// in your Supabase Dashboard → Auth → URL Configuration → Redirect URLs.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)

    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (!code) {
        console.error('[auth/callback] Missing ?code param')
        return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
    }

    const supabase = await createClient()

    // Exchange the one-time code for a session cookie
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error('[auth/callback] Code exchange failed:', error.message)
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(error.message)}`
        )
    }

    // ── Create profile row for first-time OAuth users ─────────────
    if (data.user) {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle()

        if (!existing) {
            const rawName =
                data.user.user_metadata?.full_name ??
                data.user.email?.split('@')[0] ??
                'user'

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

    // Guard against open-redirect
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'
    return NextResponse.redirect(`${origin}${safeNext}`)
}