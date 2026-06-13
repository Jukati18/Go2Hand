'use client'

// src/app/checkout/success/page.tsx
// ─────────────────────────────────────────────────────────────────
// Checkout success redirect handler.
//
// Stripe redirects here after a successful payment with ?order_id=.
// This page immediately forwards to the full order confirmation page
// at /orders/[id]/confirmation which has:
//   • Animated success burst
//   • Inspection countdown
//   • What happens next timeline
//   • Full order details
//
// If no order_id is in the URL (e.g. direct navigation), falls back
// to a simple success screen with a link to order history.
// ─────────────────────────────────────────────────────────────────

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

// ── Inner component reads search params & redirects ───────────────
function SuccessRedirect() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const orderId = searchParams.get('order_id')

    useEffect(() => {
        if (orderId) {
            // Small delay so users see the flash confirmation,
            // then forward to the rich confirmation page.
            const timer = setTimeout(() => {
                router.replace(`/orders/${orderId}/confirmation`)
            }, 800)
            return () => clearTimeout(timer)
        }
    }, [orderId, router])

    // ── No order ID — fallback static screen ──────────────────────
    if (!orderId) {
        return (
            <div className="max-w-[480px] mx-auto px-6 py-20 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-teal-50
                    border-2 border-teal-200 flex items-center justify-center">
                    <CheckCircleIcon className="w-10 h-10 text-teal-600" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Payment received!</h1>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Your order has been placed and your payment is safely held in escrow.
                </p>
                <div className="flex flex-col gap-3">
                    <Link
                        href="/dashboard/orders"
                        className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-semibold
                            rounded-xl flex items-center justify-center gap-2 text-sm
                            transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                        View My Orders
                        <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/devices"
                        className="w-full h-11 border-2 border-gray-200 text-gray-600 font-semibold
                            rounded-xl flex items-center justify-center text-sm
                            hover:border-teal-400 hover:text-teal-700 transition-colors"
                    >
                        Continue Browsing
                    </Link>
                </div>
            </div>
        )
    }

    // ── Has order ID — brief splash before redirect ────────────────
    return (
        <div className="max-w-[480px] mx-auto px-6 py-20 text-center">
            {/* Animated checkmark */}
            <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-teal-100 animate-ping opacity-30" />
                <div className="relative w-20 h-20 rounded-full bg-teal-600
                    flex items-center justify-center shadow-xl
                    animate-[scale-in_.5s_cubic-bezier(0.175,0.885,0.32,1.275)_both]">
                    <style>{`
                        @keyframes scale-in {
                            0%   { transform: scale(0); opacity: 0; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>
                    <CheckCircleIcon className="w-11 h-11 text-white" />
                </div>
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-2">
                Payment confirmed!
            </h1>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Loading your order details…
            </p>

            {/* Loading dots */}
            <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                    />
                ))}
            </div>
        </div>
    )
}

// ── Default export ────────────────────────────────────────────────
export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
            <Suspense fallback={
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 rounded-full border-4 border-teal-200
                        border-t-teal-700 animate-spin" />
                </div>
            }>
                <SuccessRedirect />
            </Suspense>
            <Footer />
        </div>
    )
}