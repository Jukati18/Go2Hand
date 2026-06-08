'use client'

// src/app/login/page.tsx
// ─────────────────────────────────────────────────────────────────
// Login page
//
// Auth methods:
//   1. Email + password
//   2. Google OAuth
//   3. Facebook OAuth (NEW)
//
// Features:
//   • Real-time field validation on blur
//   • Show/hide password toggle
//   • 14-day session persistence via Supabase refresh tokens
//   • Redirects to ?next= URL after success
//   • Friendly server error messages
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    EyeIcon, EyeSlashIcon, ShieldCheckIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { actionSignIn } from '@/actions/auth'
import { supabase } from '@/lib/supabaseClient'

// ── Validation helpers ────────────────────────────────────────────
function validateEmail(v: string): string {
    if (!v.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        return 'Please enter a valid email address.'
    return ''
}
function validatePassword(v: string): string {
    if (!v) return 'Password is required.'
    if (v.length < 6) return 'Password must be at least 6 characters.'
    return ''
}

function FieldError({ msg }: { msg: string }) {
    if (!msg) return null
    return (
        <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
            <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
            {msg}
        </p>
    )
}

const TRUST = [
    { icon: '🔒', text: 'Escrow-protected payments' },
    { icon: '📱', text: 'IMEI-verified devices' },
    { icon: '⭐', text: 'Verified seller ratings' },
    { icon: '↩️', text: '30-day hassle-free returns' },
]

// ── Facebook SVG icon ─────────────────────────────────────────────
function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
    )
}

// ── Google SVG icon ───────────────────────────────────────────────
function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────────
function LoginForm() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const nextUrl      = searchParams.get('next') ?? '/'

    const [email,         setEmail]         = useState('')
    const [password,      setPassword]      = useState('')
    const [showPw,        setShowPw]        = useState(false)
    const [touched,       setTouched]       = useState({ email: false, password: false })
    const [submitting,    setSubmitting]    = useState(false)
    const [serverError,   setServerError]   = useState('')
    const [googleLoading, setGoogleLoading] = useState(false)
    const [fbLoading,     setFbLoading]     = useState(false)

    const emailErr = touched.email    ? validateEmail(email)       : ''
    const pwErr    = touched.password ? validatePassword(password)  : ''
    const isValid  = !validateEmail(email) && !validatePassword(password)

    const touch = (field: 'email' | 'password') =>
        setTouched(t => ({ ...t, [field]: true }))

    // ── Email / password submit ───────────────────────────────────
    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault()
        setTouched({ email: true, password: true })
        if (!isValid) return

        setSubmitting(true)
        setServerError('')

        const fd = new FormData()
        fd.set('email',    email)
        fd.set('password', password)

        const result = await actionSignIn(fd)

        if (!result.success) {
            setServerError(result.error ?? 'Something went wrong.')
            setSubmitting(false)
            return
        }

        router.push(nextUrl)
        router.refresh()
    }, [email, password, isValid, nextUrl, router])

    // ── Google OAuth ──────────────────────────────────────────────
    const handleGoogle = useCallback(async () => {
        setGoogleLoading(true)
        setServerError('')

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // IMPORTANT: This URL must be in Supabase Auth → URL Configuration → Redirect URLs
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
                queryParams: {
                    // Request offline access so we get a refresh token (for 14-day persistence)
                    access_type: 'offline',
                    prompt: 'select_account', // Always show account picker
                },
            },
        })

        if (error) {
            setServerError(error.message)
            setGoogleLoading(false)
        }
        // On success: browser redirects to Google → back to /auth/callback
    }, [nextUrl])

    // ── Facebook OAuth ────────────────────────────────────────────
    // Prerequisites (one-time setup in Supabase Dashboard):
    //   1. Go to Authentication → Providers → Facebook
    //   2. Enable it and paste your Facebook App ID + App Secret
    //   3. Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
    //      to your Facebook App's "Valid OAuth Redirect URIs"
    //   4. Add /auth/callback to Supabase's Redirect URL allowlist
    //
    // To get a Facebook App ID:
    //   → developers.facebook.com → My Apps → Create App
    //   → Choose "Consumer" → add "Facebook Login" product
    const handleFacebook = useCallback(async () => {
        setFbLoading(true)
        setServerError('')

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
                scopes: 'email,public_profile', // Minimum required scopes
            },
        })

        if (error) {
            // Common error: provider not enabled in Supabase yet
            setServerError(
                error.message.includes('provider is not enabled')
                    ? 'Facebook login is not enabled yet. Please use Google or email.'
                    : error.message
            )
            setFbLoading(false)
        }
    }, [nextUrl])

    const inputCls = (hasError: boolean) =>
        `w-full border rounded-xl px-4 py-3 text-sm text-gray-800 outline-none
        transition-all placeholder:text-gray-400
        ${hasError
            ? 'border-red-400 ring-2 ring-red-100'
            : 'border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
        }`

    return (
        <div className="min-h-screen flex">

            {/* ===== LEFT: Brand panel (desktop only) ===== */}
            <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0
                bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 px-12 py-14">

                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L18.18 8 12 11.82 5.82 8 12 4.18zM5 9.5l6 3.32V19.5L5 16.18V9.5zm8 9.98v-7.16l6-3.32v6.68L13 19.48z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">
                        Go2 <span className="text-amber-400">Hand</span>
                    </span>
                </Link>

                <div className="flex-1 flex flex-col justify-center gap-8 my-10">
                    <div>
                        <h2 className="text-3xl font-black text-white leading-tight mb-3">
                            Vietnam&apos;s safest way to buy & sell tech.
                        </h2>
                        <p className="text-teal-200 text-base leading-relaxed">
                            Every transaction is escrow-protected. Every device is
                            IMEI-verified. Sign in and shop with confidence.
                        </p>
                    </div>
                    <ul className="flex flex-col gap-3.5">
                        {TRUST.map(({ icon, text }) => (
                            <li key={text} className="flex items-center gap-3 text-teal-100 text-sm">
                                <span className="text-lg leading-none w-6 text-center">{icon}</span>
                                {text}
                            </li>
                        ))}
                    </ul>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                        <p className="text-teal-50 text-sm leading-relaxed italic mb-3">
                            &ldquo;Bought an iPhone 15 for half the retail price. The escrow feature
                            gave me total peace of mind.&rdquo;
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center
                                text-amber-900 text-xs font-bold">AJ</div>
                            <div>
                                <p className="text-white text-xs font-bold">Alex Johnson</p>
                                <p className="text-teal-300 text-xs">Verified buyer ★★★★★</p>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-teal-500 text-xs">© 2025 Go2Hand · IMEI verified · Escrow protected</p>
            </div>

            {/* ===== RIGHT: Form area ===== */}
            <div className="flex-1 flex flex-col items-center justify-center
                bg-gray-50 px-6 py-12 min-h-screen overflow-y-auto">

                {/* Mobile logo */}
                <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
                    <div className="w-9 h-9 rounded-lg bg-teal-800 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L18.18 8 12 11.82 5.82 8 12 4.18zM5 9.5l6 3.32V19.5L5 16.18V9.5zm8 9.98v-7.16l6-3.32v6.68L13 19.48z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-teal-800 tracking-tight">
                        Go2 <span className="text-amber-500">Hand</span>
                    </span>
                </Link>

                <div className="w-full max-w-[420px]">
                    <div className="mb-7">
                        <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back 👋</h1>
                        <p className="text-sm text-gray-500">Sign in to your Go2Hand account</p>
                    </div>

                    {/* ── OAuth buttons ── */}
                    <div className="flex flex-col gap-3 mb-5">

                        {/* Google */}
                        <button
                            onClick={handleGoogle}
                            disabled={googleLoading || fbLoading || submitting}
                            className="w-full flex items-center justify-center gap-3 bg-white border-2
                                border-gray-200 hover:border-gray-300 text-gray-700 font-semibold
                                py-3 rounded-xl transition-all duration-150 hover:shadow-sm
                                disabled:opacity-60 disabled:cursor-wait"
                        >
                            {googleLoading ? (
                                <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                            ) : <GoogleIcon />}
                            {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={handleFacebook}
                            disabled={fbLoading || googleLoading || submitting}
                            className="w-full flex items-center justify-center gap-3 bg-white border-2
                                border-gray-200 hover:border-[#1877F2]/40 text-gray-700 font-semibold
                                py-3 rounded-xl transition-all duration-150 hover:shadow-sm
                                disabled:opacity-60 disabled:cursor-wait"
                        >
                            {fbLoading ? (
                                <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                            ) : <FacebookIcon />}
                            {fbLoading ? 'Redirecting to Facebook…' : 'Continue with Facebook'}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">or continue with email</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* ── Email/password form ── */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                        {/* Email */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500
                                uppercase tracking-wider mb-1.5">
                                Email address <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onBlur={() => touch('email')}
                                placeholder="you@example.com"
                                autoComplete="email"
                                className={inputCls(!!emailErr)}
                            />
                            <FieldError msg={emailErr} />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Password <span className="text-red-400">*</span>
                                </label>
                                <Link href="/forgot-password"
                                    className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onBlur={() => touch('password')}
                                    placeholder="Your password"
                                    autoComplete="current-password"
                                    className={`${inputCls(!!pwErr)} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2
                                        text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <FieldError msg={pwErr} />
                        </div>

                        {/* Server error */}
                        {serverError && (
                            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200
                                rounded-xl px-4 py-3 animate-[fadeDown_.2s_ease_both]">
                                <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{serverError}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || googleLoading || fbLoading}
                            className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-bold
                                rounded-xl text-[15px] flex items-center justify-center gap-2
                                transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                                disabled:opacity-60 disabled:cursor-wait disabled:translate-y-0
                                active:scale-95 mt-1"
                        >
                            {submitting ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                    </svg>
                                    Signing in…
                                </>
                            ) : 'Sign in →'}
                        </button>
                    </form>

                    {/* Sign up link */}
                    <p className="text-center text-sm text-gray-500 mt-5">
                        Don&apos;t have an account?{' '}
                        <Link href={`/signup${nextUrl !== '/' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
                            className="text-teal-700 font-semibold hover:text-teal-900 transition-colors">
                            Create one free →
                        </Link>
                    </p>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-3 mt-8 lg:hidden">
                        {[
                            { icon: '🔒', label: 'Escrow' },
                            { icon: '✅', label: 'IMEI Verified' },
                            { icon: '↩️', label: '30-day return' },
                        ].map(({ icon, label }) => (
                            <div key={label} className="flex items-center gap-1.5 text-[11px]
                                text-gray-400 bg-white border border-gray-200 px-2.5 py-1.5 rounded-full">
                                <span>{icon}</span>{label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-700 animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}