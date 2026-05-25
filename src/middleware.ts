// src/middleware.ts
// ─────────────────────────────────────────────────────────────────
// Supabase session refresh + route protection
//
// Two jobs:
//  1. Refresh the Supabase session on every request so cookies
//     stay fresh (required by @supabase/ssr).
//  2. Redirect unauthenticated users away from protected routes
//     to /login?next=<originalPath>, and redirect authenticated
//     users away from /login and /signup to the homepage.
// ─────────────────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
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

// Routes that authenticated users should be bounced out of
const AUTH_PATHS = ['/login', '/signup']

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    // ── Build SSR Supabase client that reads/writes cookies ──────
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // First propagate into the request so downstream
                    // server components see the refreshed session.
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    // Rebuild the response so the browser gets the new
                    // Set-Cookie headers.
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // ── Refresh session (getUser is the correct call here per Supabase docs) ──
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // ── Protect private routes ────────────────────────────────────
    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
    )

    if (isProtected && !user) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // ── Bounce authenticated users out of auth pages ──────────────
    const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p))

    if (isAuthPage && user) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    // Skip Next.js internals, static files, and all API routes
    // (API routes do their own auth checks).
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
}