'use client'

// src/app/checkout/success/page.tsx
// Shown after a successful payment. Reads order_id from ?order_id= param.
// The order may still be 'pending' if the webhook hasn't fired yet — that's OK.

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    CheckCircleIcon,
    ShieldCheckIcon,
    ClockIcon,
    TruckIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'

function SuccessContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get('order_id')
    const [dots, setDots] = useState('.')

    // Animated "Processing…" dots — adds life while webhook processes
    useEffect(() => {
        const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
        return () => clearInterval(t)
    }, [])

    return (
        <div className="max-w-[560px] mx-auto px-6 py-16 text-center">

            {/* Success icon with ring animation */}
            <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-30" />
                <div className="relative w-24 h-24 rounded-full bg-teal-50 border-2 border-teal-200
                    flex items-center justify-center">
                    <CheckCircleIcon className="w-12 h-12 text-teal-600" />
                </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment received!</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Your payment is safely held in escrow. It will be released to the seller
                only after you inspect and approve the device.
            </p>

            {/* Order ID */}
            {orderId && (
                <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 mb-6 shadow-sm">
                    <p className="text-xs text-gray-400 mb-1">Order reference</p>
                    <p className="text-sm font-mono font-bold text-gray-900">
                        #{orderId.slice(0, 8).toUpperCase()}
                    </p>
                </div>
            )}

            {/* What happens next */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm text-left">
                <h2 className="text-sm font-bold text-gray-900 mb-4">What happens next</h2>
                <div className="flex flex-col gap-4">
                    {[
                        {
                            icon: ShieldCheckIcon,
                            color: 'text-emerald-600',
                            bg: 'bg-emerald-50',
                            title: 'Funds held in escrow',
                            desc: 'Your money is secure — not paid to the seller yet.',
                        },
                        {
                            icon: TruckIcon,
                            color: 'text-blue-600',
                            bg: 'bg-blue-50',
                            title: 'Seller ships the device',
                            desc: 'The seller has been notified and will ship with tracking.',
                        },
                        {
                            icon: ClockIcon,
                            color: 'text-amber-600',
                            bg: 'bg-amber-50',
                            title: '5-day inspection window',
                            desc: 'Once delivered, you have 5 days to approve or dispute.',
                        },
                    ].map(({ icon: Icon, color, bg, title, desc }) => (
                        <div key={title} className="flex items-start gap-3">
                            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
                {orderId && (
                    <Link
                        href={`/orders/${orderId}`}
                        className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-semibold
                            rounded-xl flex items-center justify-center gap-2 text-sm
                            transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                        Track your order
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
            </div>
        </div>
    )
}

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
        </div>
    )
}