'use client'

// src/app/signup/page.tsx
// ─────────────────────────────────────────────────────────────────
// Signup page — Google + Facebook OAuth + email/password
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    EyeIcon, EyeSlashIcon,
    CheckCircleIcon, ExclamationCircleIcon, EnvelopeIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import { actionSignUp } from '@/actions/auth'
import { supabase } from '@/lib/supabaseClient'

// ── Validation helpers ────────────────────────────────────────────
function validateUsername(v: string): string {
    if (!v.trim()) return 'Username is required.'
    if (v.length < 3) return 'Must be at least 3 characters.'
    if (v.length > 20) return 'Must be 20 characters or fewer.'
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Only letters, numbers, and underscores.'
    return ''
}
function validateEmail(v: string): string {
    if (!v.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address.'
    return ''
}
function validatePassword(v: string): string {
    if (!v) return 'Password is required.'
    if (v.length < 8) return 'Must be at least 8 characters.'
    return ''
}
function validateConfirm(pw: string, confirm: string): string {
    if (!confirm) return 'Please confirm your password.'
    if (pw !== confirm) return 'Passwords do not match.'
    return ''
}

type StrengthLevel = { score: number; label: string; color: string; barColor: string }
function getStrength(pw: string): StrengthLevel {
    if (!pw) return { score: 0, label: '', color: '', barColor: '' }
    let score = 0
    if (pw.length >= 8)           score++
    if (pw.length >= 12)          score++
    if (/[A-Z]/.test(pw))         score++
    if (/[0-9]/.test(pw))         score++
    if (/[^A-Za-z0-9]/.test(pw))  score++
    if (score <= 1) return { score: 1, label: 'Weak',   color: 'text-red-500',    barColor: 'bg-red-500'    }
    if (score <= 2) return { score: 2, label: 'Fair',   color: 'text-orange-500', barColor: 'bg-orange-400' }
    if (score <= 3) return { score: 3, label: 'Good',   color: 'text-yellow-600', barColor: 'bg-yellow-400' }
    return              { score: 4, label: 'Strong', color: 'text-emerald-600', barColor: 'bg-emerald-500' }
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

const inputCls = (hasError: boolean, extraRight = false) =>
    `w-full border rounded-xl px-4 py-3 ${extraRight ? 'pr-12' : ''} text-sm text-gray-800
    outline-none transition-all placeholder:text-gray-400 bg-white
    ${hasError
        ? 'border-red-400 ring-2 ring-red-100 focus:border-red-400'
        : 'border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
    }`

// ── Facebook icon ─────────────────────────────────────────────────
function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
    )
}

// ── Check-email screen ────────────────────────────────────────────
function CheckEmailScreen({ email }: { email: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
            <div className="w-full max-w-[400px] text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-teal-50 border-2 border-teal-200
                    flex items-center justify-center">
                    <EnvelopeIcon className="w-10 h-10 text-teal-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Check your inbox</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    We sent a verification link to{' '}
                    <span className="font-semibold text-gray-800">{email}</span>.
                    Click it to activate your account.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs
                    text-amber-700 leading-relaxed mb-8">
                    Didn&apos;t receive it? Check your spam folder, or try signing up again.
                </div>
                <Link href="/login"
                    className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                        text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all
                        hover:-translate-y-0.5 hover:shadow-md">
                    Back to sign in
                </Link>
            </div>
        </div>
    )
}

// ── Main signup form ──────────────────────────────────────────────
function SignupForm() {
    const router       = useRouter()
    const searchParams = useSearchParams()
    const nextUrl      = searchParams.get('next') ?? '/'

    const [username,    setUsername]    = useState('')
    const [email,       setEmail]       = useState('')
    const [password,    setPassword]    = useState('')
    const [confirm,     setConfirm]     = useState('')
    const [showPw,      setShowPw]      = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [agreed,      setAgreed]      = useState(false)
    const [touched, setTouched] = useState({
        username: false, email: false, password: false, confirm: false,
    })
    const [submitting,    setSubmitting]    = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [fbLoading,     setFbLoading]     = useState(false)
    const [serverError,   setServerError]   = useState('')
    const [emailSent,     setEmailSent]     = useState(false)

    const strength = getStrength(password)

    const usernameErr = touched.username ? validateUsername(username) : ''
    const emailErr    = touched.email    ? validateEmail(email)       : ''
    const pwErr       = touched.password ? validatePassword(password) : ''
    const confirmErr  = touched.confirm  ? validateConfirm(password, confirm) : ''

    const isValid =
        !validateUsername(username) &&
        !validateEmail(email)       &&
        !validatePassword(password) &&
        !validateConfirm(password, confirm) &&
        agreed

    const touch = (field: keyof typeof touched) =>
        setTouched(t => ({ ...t, [field]: true }))

    // ── Email/password submit ─────────────────────────────────────
    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault()
        setTouched({ username: true, email: true, password: true, confirm: true })
        if (!isValid) return

        setSubmitting(true)
        setServerError('')

        const fd = new FormData()
        fd.set('username', username.trim())
        fd.set('email',    email.trim().toLowerCase())
        fd.set('password', password)

        const result = await actionSignUp(fd)

        if (!result.success && result.error !== 'CHECK_EMAIL') {
            setServerError(result.error ?? 'Something went wrong.')
            setSubmitting(false)
            return
        }

        if (result.error === 'CHECK_EMAIL') {
            setEmailSent(true)
            return
        }

        router.push(nextUrl)
        router.refresh()
    }, [username, email, password, isValid, nextUrl, router])

    // ── Google OAuth ──────────────────────────────────────────────
    const handleGoogle = useCallback(async () => {
        setGoogleLoading(true)
        setServerError('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
                queryParams: { access_type: 'offline', prompt: 'select_account' },
            },
        })
        if (error) {
            setServerError(error.message)
            setGoogleLoading(false)
        }
    }, [nextUrl])

    // ── Facebook OAuth ────────────────────────────────────────────
    const handleFacebook = useCallback(async () => {
        setFbLoading(true)
        setServerError('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
                scopes: 'email,public_profile',
            },
        })
        if (error) {
            setServerError(
                error.message.includes('provider is not enabled')
                    ? 'Facebook login is not enabled yet. Please use Google or email.'
                    : error.message
            )
            setFbLoading(false)
        }
    }, [nextUrl])

    if (emailSent) return <CheckEmailScreen email={email} />

    return (
        <div className="min-h-screen flex">

            {/* ===== LEFT: Brand panel ===== */}
            <div className="hidden lg:flex flex-col justify-between w-[440px] shrink-0
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

                <div className="flex-1 flex flex-col justify-center gap-6 my-10">
                    <div>
                        <h2 className="text-3xl font-black text-white leading-tight mb-3">
                            Join 2,400+ buyers & sellers.
                        </h2>
                        <p className="text-teal-200 text-base leading-relaxed">
                            Create a free account and start buying or selling verified
                            second-hand tech safely.
                        </p>
                    </div>
                    {[
                        'Browse 1,200+ verified smartphone listings',
                        'Sell your device in minutes with auto-pricing',
                        'Escrow protection on every purchase',
                        'IMEI blacklist check on every device',
                        '5-day inspection window before payment releases',
                    ].map(benefit => (
                        <div key={benefit} className="flex items-start gap-3">
                            <CheckSolid className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-teal-100 leading-snug">{benefit}</p>
                        </div>
                    ))}
                </div>
                <p className="text-teal-500 text-xs">© 2025 Go2Hand · All rights reserved</p>
            </div>

            {/* ===== RIGHT: Form ===== */}
            <div className="flex-1 flex flex-col items-center justify-center
                bg-gray-50 px-6 py-12 overflow-y-auto">

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

                <div className="w-full max-w-[440px]">
                    <div className="mb-7">
                        <h1 className="text-2xl font-black text-gray-900 mb-1">Create your account</h1>
                        <p className="text-sm text-gray-500">Free forever — no credit card required</p>
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
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            )}
                            {googleLoading ? 'Redirecting…' : 'Sign up with Google'}
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
                            {fbLoading ? 'Redirecting…' : 'Sign up with Facebook'}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">or sign up with email</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* ── Email form ── */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                        {/* Username */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500
                                uppercase tracking-wider mb-1.5">
                                Username <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                    onBlur={() => touch('username')}
                                    placeholder="your_username"
                                    autoComplete="username"
                                    maxLength={20}
                                    className={`${inputCls(!!usernameErr)} pl-8`}
                                />
                            </div>
                            {usernameErr ? (
                                <FieldError msg={usernameErr} />
                            ) : username.length >= 3 ? (
                                <p className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600">
                                    <CheckCircleIcon className="w-3.5 h-3.5" /> Looks good!
                                </p>
                            ) : (
                                <p className="mt-1.5 text-xs text-gray-400">
                                    3–20 chars, letters · numbers · underscores only
                                </p>
                            )}
                        </div>

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
                            <label className="block text-[11px] font-bold text-gray-500
                                uppercase tracking-wider mb-1.5">
                                Password <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onBlur={() => touch('password')}
                                    placeholder="Min. 8 characters"
                                    autoComplete="new-password"
                                    className={inputCls(!!pwErr, true)}
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2
                                        text-gray-400 hover:text-gray-600 transition-colors">
                                    {showPw ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-300
                                                    ${i <= strength.score ? strength.barColor : 'bg-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-semibold ${strength.color}`}>
                                        {strength.label}
                                    </p>
                                </div>
                            )}
                            <FieldError msg={pwErr} />
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500
                                uppercase tracking-wider mb-1.5">
                                Confirm password <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    onBlur={() => touch('confirm')}
                                    placeholder="Re-enter your password"
                                    autoComplete="new-password"
                                    className={inputCls(!!confirmErr, true)}
                                />
                                <button type="button" onClick={() => setShowConfirm(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2
                                        text-gray-400 hover:text-gray-600 transition-colors">
                                    {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {!confirmErr && confirm && confirm === password ? (
                                <p className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600">
                                    <CheckCircleIcon className="w-3.5 h-3.5" /> Passwords match!
                                </p>
                            ) : (
                                <FieldError msg={confirmErr} />
                            )}
                        </div>

                        {/* Terms checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative mt-0.5 shrink-0">
                                <input type="checkbox" checked={agreed}
                                    onChange={e => setAgreed(e.target.checked)} className="sr-only" />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                                    transition-all duration-150
                                    ${agreed ? 'bg-teal-700 border-teal-700' : 'border-gray-300 group-hover:border-teal-400'}`}>
                                    {agreed && (
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                                            <path d="M1 5l3.5 3.5 6.5-8" stroke="currentColor"
                                                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                I agree to Go2Hand&apos;s{' '}
                                <Link href="/terms" className="text-teal-700 hover:underline">Terms of Service</Link>
                                {' '}and{' '}
                                <Link href="/privacy" className="text-teal-700 hover:underline">Privacy Policy</Link>.
                            </p>
                        </label>

                        {/* Server error */}
                        {serverError && (
                            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200
                                rounded-xl px-4 py-3">
                                <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{serverError}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || googleLoading || fbLoading || !agreed}
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
                                    Creating account…
                                </>
                            ) : 'Create free account →'}
                        </button>
                    </form>

                    {/* Sign in link */}
                    <p className="text-center text-sm text-gray-500 mt-5">
                        Already have an account?{' '}
                        <Link href={`/login${nextUrl !== '/' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`}
                            className="text-teal-700 font-semibold hover:text-teal-900 transition-colors">
                            Sign in →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-700 animate-spin" />
            </div>
        }>
            <SignupForm />
        </Suspense>
    )
}