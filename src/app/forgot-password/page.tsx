'use client'

// src/app/forgot-password/page.tsx
// ─────────────────────────────────────────────────────────────────
// Forgot password — sends a Supabase password-reset email.
//
// States:
//   idle     → email input form
//   loading  → spinner on submit
//   sent     → "check your inbox" confirmation screen
//   error    → inline error banner
// ─────────────────────────────────────────────────────────────────

import { useState, FormEvent, useCallback } from 'react'
import Link from 'next/link'
import { EnvelopeIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabaseClient'

function validateEmail(v: string): string {
    if (!v.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        return 'Please enter a valid email address.'
    return ''
}

export default function ForgotPasswordPage() {
    const [email,   setEmail]   = useState('')
    const [touched, setTouched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [sent,    setSent]    = useState(false)
    const [error,   setError]   = useState('')

    const emailErr = touched ? validateEmail(email) : ''
    const isValid  = !validateEmail(email)

    const handleSubmit = useCallback(
        async (e: FormEvent) => {
            e.preventDefault()
            setTouched(true)
            if (!isValid) return

            setLoading(true)
            setError('')

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                email.trim().toLowerCase(),
                {
                    // After clicking the link in the email, Supabase will
                    // redirect here so the user can set a new password.
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                }
            )

            setLoading(false)

            if (resetError) {
                setError(resetError.message)
                return
            }

            // Always show "sent" even if the email doesn't exist (prevents
            // email enumeration attacks).
            setSent(true)
        },
        [email, isValid]
    )

    // ── Success screen ────────────────────────────────────────────
    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
                <div className="w-full max-w-[380px] text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-teal-50 border-2
                        border-teal-200 flex items-center justify-center
                        animate-[fadeUp_.4s_ease_both]">
                        <EnvelopeIcon className="w-10 h-10 text-teal-600" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">
                        Check your inbox
                    </h1>
                    <p className="text-sm text-gray-500 leading-relaxed mb-2">
                        If an account exists for{' '}
                        <span className="font-semibold text-gray-800">{email}</span>,
                        we sent a password reset link.
                    </p>
                    <p className="text-xs text-gray-400 mb-8">
                        The link expires in 1 hour. Check your spam folder if you
                        don&apos;t see it.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                            text-white font-semibold px-6 py-3 rounded-xl text-sm
                            transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                        Back to sign in
                    </Link>
                </div>
            </div>
        )
    }

    // ── Form ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
            <div className="w-full max-w-[400px]">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mb-10">
                    <div className="w-9 h-9 rounded-lg bg-teal-800 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L18.18 8 12 11.82 5.82 8 12 4.18zM5 9.5l6 3.32V19.5L5 16.18V9.5zm8 9.98v-7.16l6-3.32v6.68L13 19.48z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-teal-800 tracking-tight">
                        Go2 <span className="text-amber-500">Hand</span>
                    </span>
                </Link>

                <div className="mb-7">
                    <h1 className="text-2xl font-black text-gray-900 mb-1">
                        Reset your password
                    </h1>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Enter the email address on your account and we&apos;ll send
                        you a reset link.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-500
                            uppercase tracking-wider mb-1.5">
                            Email address <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onBlur={() => setTouched(true)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            autoFocus
                            className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-800
                                outline-none transition-all placeholder:text-gray-400
                                ${emailErr
                                    ? 'border-red-400 ring-2 ring-red-100'
                                    : 'border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100'
                                }`}
                        />
                        {emailErr && (
                            <p className="flex items-center gap-1 mt-1.5 text-xs text-red-500">
                                <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
                                {emailErr}
                            </p>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200
                            rounded-xl px-4 py-3">
                            <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-bold
                            rounded-xl text-[15px] flex items-center justify-center gap-2
                            transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                            disabled:opacity-60 disabled:cursor-wait active:scale-95"
                    >
                        {loading ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor"
                                        strokeWidth="3" strokeOpacity=".3"/>
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"
                                        strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                                Sending…
                            </>
                        ) : 'Send reset link'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-5">
                    Remembered it?{' '}
                    <Link href="/login"
                        className="text-teal-700 font-semibold hover:text-teal-900 transition-colors">
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    )
}