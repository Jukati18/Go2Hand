'use client'

// src/app/checkout/success/page.tsx
// ─────────────────────────────────────────────────────────────────
// Shown after a successful payment.
// Reads ?order_id= from the URL.
//
// The order may still be 'pending' if the Stripe webhook hasn't
// fired yet — that's normal. The order detail page will show the
// real status once the webhook upgrades it to 'paid'.
// ─────────────────────────────────────────────────────────────────

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
    CheckCircleIcon,
    ShieldCheckIcon,
    TruckIcon,
    ClockIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline'

// ── Inner component — reads search params ─────────────────────────
function SuccessContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get('order_id')

    return (
        <div className="max-w-[560px] mx-auto px-6 py-14 sm:py-20 text-center">

            {/* Animated success icon */}
            <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-25" />
                <div className="relative w-24 h-24 rounded-full bg-teal-50
                    border-2 border-teal-200 flex items-center justify-center
                    animate-[fadeUp_.5s_ease_both]">
                    <CheckCircleIcon className="w-12 h-12 text-teal-600" />
                </div>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2
                animate-[fadeUp_.5s_ease_both_.1s]">
                Payment received!
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-7
                animate-[fadeUp_.5s_ease_both_.15s]">
                Your money is safely held in escrow — the seller can&apos;t touch it
                until you inspect and approve the device.
            </p>

            {/* Order reference */}
            {orderId && (
                <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-7
                    shadow-sm animate-[fadeUp_.5s_ease_both_.2s]">
                    <p className="text-xs text-gray-400 mb-1">Order reference</p>
                    <p className="text-base font-mono font-bold text-gray-900">
                        #{orderId.slice(0, 8).toUpperCase()}
                    </p>
                </div>
            )}

            {/* What happens next */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 mb-8
                shadow-sm text-left animate-[fadeUp_.5s_ease_both_.25s]">
                <h2 className="text-sm font-bold text-gray-900 mb-4">What happens next</h2>
                <div className="flex flex-col gap-4">
                    {[
                        {
                            icon: ShieldCheckIcon,
                            color: 'text-emerald-600',
                            bg: 'bg-emerald-50',
                            title: 'Funds held in escrow',
                            desc: 'Your payment is secure — not paid to the seller yet.',
                        },
                        {
                            icon: TruckIcon,
                            color: 'text-blue-600',
                            bg: 'bg-blue-50',
                            title: 'Seller ships the device',
                            desc: 'The seller has been notified and will ship with a tracking number.',
                        },
                        {
                            icon: ClockIcon,
                            color: 'text-amber-600',
                            bg: 'bg-amber-50',
                            title: '5-day inspection window',
                            desc: 'Once delivered, you have 5 days to approve or raise a dispute.',
                        },
                    ].map(({ icon: Icon, color, bg, title, desc }) => (
                        <div key={title} className="flex items-start gap-3">
                            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 animate-[fadeUp_.5s_ease_both_.3s]">
                {orderId && (
                    <Link
                        href={`/orders/${orderId}`}
                        className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white
                            font-semibold rounded-xl flex items-center justify-center gap-2
                            text-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                        Track your order
                        <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                )}
                <Link
                    href="/devices"
                    className="w-full h-12 border-2 border-gray-200 hover:border-teal-400
                        text-gray-600 hover:text-teal-700 font-semibold rounded-xl
                        flex items-center justify-center text-sm transition-colors"
                >
                    Continue browsing
                </Link>
                <Link
                    href="/dashboard/orders"
                    className="text-sm text-gray-400 hover:text-teal-700 transition-colors"
                >
                    View all my orders
                </Link>
            </div>
        </div>
    )
}

// ── Default export — wraps in Suspense for useSearchParams ────────
export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
            <Suspense fallback={
                <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
                    Loading…
                </div>
            }>
                <SuccessContent />
            </Suspense>
            <Footer />
        </div>
    )
}