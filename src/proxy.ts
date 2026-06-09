// src/proxy.ts
// ─────────────────────────────────────────────────────────────────
// Two jobs:
//  1. Refresh the Supabase session cookie on every request
//     (required by @supabase/ssr to keep tokens fresh).
//  2. Route protection:
//     - Unauthenticated users hitting /dashboard, /orders, etc.
//       are redirected to /login?next=<originalPath>
//     - Authenticated users hitting /login or /signup
//       are redirected away (they're already signed in)
//
// WHY getSession() instead of getUser():
//   getUser() makes a live network call to Supabase on EVERY request.
//   If env vars are missing or Supabase is slow, it crashes the proxy
//   silently — which is exactly why /login and /signup were failing to load.
//   getSession() reads from the cookie: no network, no crash risk.
// ─────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
 
// ── Routes that require an authenticated session ──────────────────
const PROTECTED_PREFIXES = [
    '/dashboard',
    '/watchlist',
    '/orders',
    '/checkout',
    '/sell',
    '/profile',
    '/settings',
    '/cart',
]
 
// ── Routes that make no sense for logged-in users ─────────────────
const AUTH_PATHS = ['/login', '/signup', '/forgot-password']
 
export async function proxy(request: NextRequest) {
    // ── CRITICAL: initialise the response with { request } ────────
    // This ensures that refreshed cookie values are forwarded to
    // Server Components. Using bare NextResponse.next() drops them.
    let supabaseResponse = NextResponse.next({ request })
 
    const { pathname } = request.nextUrl
 
    // ── Guard: skip if env vars are missing ───────────────────────
    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 
    if (!supabaseUrl || !supabaseAnon) {
        console.warn('[Proxy] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.')
        return supabaseResponse
    }
 
    // ── Create SSR Supabase client ────────────────────────────────
    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                // Step 1: write cookies into the cloned request so
                // downstream Server Components see the fresh tokens.
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                )
                // Step 2: rebuild the response WITH { request } so
                // the refreshed cookies are attached to the response
                // that goes back to the browser.
                supabaseResponse = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })
 
    // ── Validate the session using getClaims() ────────────────────
    // getClaims() verifies the JWT signature locally — no network
    // call, never returns a stale/phantom session.
    // Returns null when: no cookie, token expired, signature invalid.
    let isAuthenticated = false
    try {
        const { data } = await supabase.auth.getClaims()
        isAuthenticated = !!data?.claims
    } catch (err) {
        // Treat any validation error as unauthenticated.
        console.error('[Proxy] getClaims() error:', err)
    }
 
    // ── Protect private routes ────────────────────────────────────
    const isProtected = PROTECTED_PREFIXES.some(prefix =>
        pathname.startsWith(prefix)
    )
 
    if (isProtected && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
    }
 
    // ── Redirect logged-in users away from auth pages ─────────────
    const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p))
 
    if (isAuthPage && isAuthenticated) {
        const next = request.nextUrl.searchParams.get('next') ?? '/'
        // Guard against open-redirect: only allow relative paths
        const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'
        return NextResponse.redirect(new URL(safeNext, request.url))
    }
 
    // ── IMPORTANT: always return supabaseResponse (not a new one) ─
    // The supabaseResponse object has the refreshed Set-Cookie headers
    // attached. Returning anything else loses the token refresh.
    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         *  - _next/static  (Next.js build assets)
         *  - _next/image   (Next.js image optimisation)
         *  - favicon.ico
         *  - api/          (API routes handle their own auth)
         *  - Image files   (no auth needed for static images)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}