// src/app/how-it-works/page.tsx
// ─────────────────────────────────────────────────────────────────
// How It Works (Escrow Guide) — /how-it-works
// Server Component — static educational content.
// Explains the full buyer/seller journey and escrow mechanics.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    CreditCardIcon,
    TruckIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    CurrencyDollarIcon,
    DevicePhoneMobileIcon,
    TagIcon,
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
    title: buildTitle(['How It Works', 'Escrow-Protected Buying & Selling']),
    description: truncateDesc(
        'Learn how Go2Hand escrow works — your payment is held safely until you inspect ' +
        'and approve the device. Step-by-step guide for buyers and sellers.'
    ),
    alternates: { canonical: `${SITE_URL}/how-it-works` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/how-it-works`,
        siteName: 'Go2Hand',
        title: 'How Go2Hand Escrow Works — Safe Second-Hand Tech',
        description: 'Your money is held safely until you approve. Here\'s exactly how.',
    },
}

// ── Buyer steps ───────────────────────────────────────────────────

const BUYER_STEPS = [
    {
        icon: MagnifyingGlassIcon,
        step: 'Browse & Choose',
        title: 'Find a verified listing',
        body:
            'Every device shows its IMEI check status, condition grade (A+/A/B/C), battery health, ' +
            'iCloud lock status, and carrier unlock status. Filter by brand, model, storage, price, ' +
            'and condition until you find exactly what you need.',
        detail: 'No hidden surprises — what you see is the device you receive.',
    },
    {
        icon: CreditCardIcon,
        step: 'Pay into Escrow',
        title: 'Your money is held, not spent',
        body:
            'When you check out, your payment is authorised on your card but not captured. ' +
            'The funds are ring-fenced — neither you nor the seller can touch them until the ' +
            'inspection window ends. Think of it as a locked safe that only opens on your command.',
        detail: 'Powered by Stripe. Your card details never touch our servers.',
    },
    {
        icon: TruckIcon,
        step: 'Seller Ships',
        title: 'The seller adds tracking',
        body:
            'Once payment is secured, the seller packages the device and adds a tracking number ' +
            'directly in Go2Hand. You\'ll see real-time escrow status change from "Paid" to ' +
            '"Shipped" — no chasing, no guessing.',
        detail: 'Sellers are motivated to ship quickly — they don\'t get paid until you approve.',
    },
    {
        icon: ClockIcon,
        step: '5-Day Inspection',
        title: 'Check everything carefully',
        body:
            'From the moment you mark the device as received, you have exactly 5 days to inspect ' +
            'it. Turn it on. Check the screen, battery, buttons, cameras, and cellular connection. ' +
            'Compare the condition to the listing photos. Test the IMEI against what was advertised.',
        detail: 'Take your time. The seller cannot pressure you during this window.',
    },
    {
        icon: CheckCircleIcon,
        step: 'Approve or Dispute',
        title: 'You decide when money moves',
        body:
            'Happy with the device? Tap "Approve" and the payment releases to the seller — usually ' +
            'within 1–3 business days. Something\'s wrong? Open a dispute before the 5 days expire ' +
            'and our team will review within 24 hours.',
        detail: 'If you do nothing, the window auto-closes after 5 days and payment releases automatically.',
    },
]

const SELLER_STEPS = [
    {
        icon: TagIcon,
        step: 'List for Free',
        title: 'Create your listing in under 5 minutes',
        body:
            'Select your device model — specs auto-fill from our database. Upload at least 5 clear ' +
            'photos, run the IMEI check, choose a condition grade honestly, and set your price. ' +
            'Our pricing tool shows you what similar devices are selling for right now.',
        detail: 'Listing is free. A 5% fee only applies when your sale completes.',
    },
    {
        icon: ShieldCheckIcon,
        step: 'Buyer Pays into Escrow',
        title: 'Payment is guaranteed before you ship',
        body:
            'When a buyer checks out, Stripe authorises their payment immediately. You see the ' +
            'escrow status go "active" in your dashboard — this is your green light. The money ' +
            'is secured. You will get paid as long as the device matches your listing.',
        detail: 'Never ship before escrow is confirmed. Your dashboard shows the exact status.',
    },
    {
        icon: TruckIcon,
        step: 'Ship with Tracking',
        title: 'Pack it well and add a tracking number',
        body:
            'Package the device securely — original box if you have it, bubble wrap if you don\'t. ' +
            'Enter the tracking number from J&T, ViettelPost, GHTK, GHN, or any carrier into ' +
            'Go2Hand. The buyer is notified automatically and can watch the delivery progress.',
        detail: 'Pro tip: take a photo of the packaged device before shipping — useful if there\'s ever a dispute.',
    },
    {
        icon: CurrencyDollarIcon,
        step: 'Get Paid',
        title: 'Receive your payout after approval',
        body:
            'Once the buyer approves the device — or the 5-day inspection window expires — Go2Hand ' +
            'releases the payment. After the 5% platform fee, your payout arrives in 1–3 business ' +
            'days. For a $500 sale, you receive $475.',
        detail: 'No surprise fees. The 5% is the only deduction.',
    },
]

const FAQS = [
    {
        q: 'What if the buyer never responds during the 5-day window?',
        a: 'If the buyer doesn\'t approve or dispute within 5 days of confirming receipt, payment ' +
            'automatically releases to you. This prevents buyers from indefinitely blocking payment.',
    },
    {
        q: 'What qualifies as a valid dispute?',
        a: 'A dispute is valid when the device materially doesn\'t match the listing — wrong model, ' +
            'different IMEI, significantly worse condition than graded, or device is non-functional. ' +
            'Buyer\'s remorse is not a valid dispute reason.',
    },
    {
        q: 'How long does Stripe hold the funds?',
        a: 'Stripe can hold authorised (uncaptured) funds for up to 7 days. Our entire shipping ' +
            'and inspection window fits within that limit. If a transaction takes longer due to ' +
            'unusual circumstances, our team handles it manually.',
    },
    {
        q: 'What happens if the seller ships a completely different device?',
        a: 'Open a dispute during your inspection window with photos and a description. Our team ' +
            'reviews within 24 hours. In clear fraud cases, the payment is cancelled immediately — ' +
            'the seller was never charged, so no refund is needed. You get your money back.',
    },
    {
        q: 'Can I cancel an order after paying?',
        a: 'Yes — buyers can cancel before the seller ships. After shipping, you\'ll need to use ' +
            'the dispute process instead. Cancellations before shipment release the Stripe authorisation ' +
            'and no funds are ever captured.',
    },
    {
        q: 'Is there a fee for buyers?',
        a: 'No. Go2Hand is free for buyers. The 5% platform fee is charged to sellers on completed sales.',
    },
]

// ─────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-16 pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-4">
                        Escrow explained
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6">
                        Your money moves only when
                        <span className="text-teal-300"> you say so.</span>
                    </h1>
                    <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mx-auto mb-8">
                        Go2Hand holds your payment in a secure escrow account until you&apos;ve inspected the device
                        and confirmed it matches the listing. No approvals, no payment. It&apos;s that simple.
                    </p>

                    {/* Visual escrow flow summary */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-3 flex-wrap">
                        {['Buyer pays', 'Funds held', 'Device ships', 'You inspect', 'You approve', 'Seller paid'].map(
                            (label, i, arr) => (
                                <div key={label} className="flex items-center gap-1.5 sm:gap-3">
                                    <span
                                        className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full
                      ${i === 0 || i === arr.length - 1
                                                ? 'bg-teal-600 text-white'
                                                : i === 4
                                                    ? 'bg-amber-400 text-amber-900'
                                                    : 'bg-white/15 text-teal-100 border border-white/20'
                                            }`}
                                    >
                                        {label}
                                    </span>
                                    {i < arr.length - 1 && (
                                        <ArrowRightIcon className="w-3 h-3 text-teal-400 shrink-0 hidden sm:block" />
                                    )}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>

            {/* ── TAB CONTENT: BUYER GUIDE ── */}
            <section className="py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[900px] mx-auto">

                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                            <DevicePhoneMobileIcon className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest">For buyers</p>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900">How to buy safely on Go2Hand</h2>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-6">
                        {BUYER_STEPS.map(({ icon: Icon, step, title, body, detail }, i) => (
                            <div
                                key={step}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                  hover:border-teal-200 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start gap-4 sm:gap-6 p-5 sm:p-6">
                                    {/* Step indicator */}
                                    <div className="shrink-0 flex flex-col items-center">
                                        <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100
                      flex items-center justify-center mb-1">
                                            <Icon className="w-5 h-5 text-teal-700" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center leading-tight">
                                            Step {i + 1}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">
                                            {step}
                                        </p>
                                        <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed mb-3">{body}</p>
                                        <div className="flex items-start gap-2 bg-teal-50 border border-teal-100
                      rounded-xl px-3.5 py-2.5">
                                            <CheckCircleIcon className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-teal-700 font-medium leading-snug">{detail}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Connector line between steps */}
                                {i < BUYER_STEPS.length - 1 && (
                                    <div className="h-0.5 bg-gradient-to-r from-teal-100 via-teal-200 to-teal-100 mx-6" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SELLER GUIDE ── */}
            <section className="bg-white border-t border-b border-gray-100 py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[900px] mx-auto">

                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                            <TagIcon className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <p className="text-amber-700 text-xs font-bold uppercase tracking-widest">For sellers</p>
                            <h2 className="text-xl sm:text-2xl font-black text-gray-900">How to sell on Go2Hand</h2>
                        </div>
                    </div>

                    {/* Steps grid — 2-col on larger screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        {SELLER_STEPS.map(({ icon: Icon, step, title, body, detail }, i) => (
                            <div
                                key={step}
                                className="bg-gray-50 border border-gray-100 rounded-2xl p-5 sm:p-6
                  hover:border-amber-200 hover:bg-amber-50/20 transition-all duration-200"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-amber-700" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                                            Step {i + 1} · {step}
                                        </p>
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">{title}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed mb-3">{body}</p>
                                <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-100
                  rounded-lg px-3 py-2 leading-snug">
                                    💡 {detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ESCROW MECHANICS (deep-dive) ── */}
            <section className="py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[900px] mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
                            The technical details
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
                            How escrow actually works
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto">
                            We use Stripe&apos;s manual-capture payment flow — the same mechanism banks use for
                            hotel holds. Here&apos;s what happens to your money at each stage.
                        </p>
                    </div>

                    {/* Visual escrow lifecycle */}
                    <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-6 sm:p-8 mb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

                            {/* Phase 1 */}
                            <div className="bg-white/10 rounded-xl p-4 sm:p-5">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                                    <CreditCardIcon className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1">
                                    Phase 1 — Authorised
                                </p>
                                <p className="text-sm font-bold text-white mb-2">Funds ring-fenced</p>
                                <p className="text-xs text-teal-200 leading-relaxed">
                                    Stripe places a hold on your card. The funds are reserved but not yet
                                    transferred to anyone. Your bank may show a pending charge.
                                </p>
                            </div>

                            {/* Phase 2 */}
                            <div className="bg-white/10 rounded-xl p-4 sm:p-5">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                                    <ClockIcon className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1">
                                    Phase 2 — Inspection
                                </p>
                                <p className="text-sm font-bold text-white mb-2">Money waits for you</p>
                                <p className="text-xs text-teal-200 leading-relaxed">
                                    The authorisation lasts up to 7 days. Our shipping + inspection window
                                    fits within this limit. Neither party can touch the funds.
                                </p>
                            </div>

                            {/* Phase 3 */}
                            <div className="bg-white/10 rounded-xl p-4 sm:p-5">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                                    <CheckCircleIcon className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1">
                                    Phase 3 — Captured or Released
                                </p>
                                <p className="text-sm font-bold text-white mb-2">Resolution</p>
                                <p className="text-xs text-teal-200 leading-relaxed">
                                    <strong className="text-white">Approve</strong> → Stripe captures the payment and
                                    transfers to Go2Hand for seller payout.{' '}
                                    <strong className="text-white">Dispute</strong> → Stripe cancels the hold. No money
                                    ever moves.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dispute process callout */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 flex gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-900 mb-1">
                                When to open a dispute
                            </h3>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Open a dispute if the device is significantly different from the listing —
                                wrong model, different IMEI, condition worse than graded, or device won&apos;t
                                power on. Provide photos and a clear description. Our team reviews every
                                dispute within 24 hours and issues a decision. Disputes must be opened
                                before your 5-day inspection window closes.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="bg-white border-t border-gray-100 py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[760px] mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Common questions</h2>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map(({ q, a }) => (
                            <div
                                key={q}
                                className="bg-gray-50 border border-gray-100 rounded-2xl p-5 sm:p-6
                  hover:border-teal-200 transition-colors"
                            >
                                <p className="text-sm font-bold text-gray-900 mb-2">{q}</p>
                                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="bg-gradient-to-br from-teal-800 to-teal-700 py-14 sm:py-16 px-4 sm:px-6">
                <div className="max-w-[640px] mx-auto text-center">
                    <ShieldCheckIcon className="w-12 h-12 text-teal-300 mx-auto mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                        Every purchase is protected.
                    </h2>
                    <p className="text-teal-200 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                        Thousands of transactions processed. Zero escrow fraud. That&apos;s the Go2Hand guarantee.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/devices"
                            className="inline-flex items-center justify-center gap-2 bg-white text-teal-800
                font-bold px-7 py-3.5 rounded-xl text-sm transition-all
                hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            Start Browsing
                            <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/buyer-protection"
                            className="inline-flex items-center justify-center gap-2 bg-white/15
                hover:bg-white/25 border border-white/30 text-white font-semibold
                px-7 py-3.5 rounded-xl text-sm transition-all"
                        >
                            Buyer Protection Policy →
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}