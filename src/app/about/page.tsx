// src/app/about/page.tsx
// ─────────────────────────────────────────────────────────────────
// About Us — /about
// Server Component — static content, no data fetching needed.
// Tells the Go2Hand story: mission, team values, and trust signals.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    ShieldCheckIcon,
    EyeIcon,
    HandRaisedIcon,
    SparklesIcon,
    ArrowRightIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
    title: buildTitle(['About Us', 'Vietnam\'s Trusted Second-Hand Marketplace']),
    description: truncateDesc(
        'Go2Hand was built to make buying and selling second-hand tech in Vietnam safe, ' +
        'transparent, and fair — with IMEI verification, escrow payments, and real buyer protection.'
    ),
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/about`,
        siteName: 'Go2Hand',
        title: 'About Go2Hand — Vietnam\'s Trusted Second-Hand Marketplace',
        description: 'Built in Vietnam to make second-hand tech safe for everyone.',
    },
}

// ── Data ──────────────────────────────────────────────────────────

const VALUES = [
    {
        icon: ShieldCheckIcon,
        title: 'Trust above everything',
        body:
            'Every device on Go2Hand goes through IMEI verification before it can be listed. ' +
            'Your money never moves until you\'ve held the device and said you\'re happy with it. ' +
            'That\'s not a feature — it\'s the foundation.',
    },
    {
        icon: EyeIcon,
        title: 'Radical transparency',
        body:
            'Condition grades, battery health, lock status — everything a buyer needs to make an ' +
            'informed decision is visible on every listing. We built the grading system so sellers ' +
            'have no room to oversell and buyers have no room to be surprised.',
    },
    {
        icon: HandRaisedIcon,
        title: 'Fair for sellers too',
        body:
            'Sellers list for free. A 5% platform fee only applies when a sale completes. ' +
            'If a buyer never approves, no fee is charged. We grow when you grow — and only then.',
    },
    {
        icon: SparklesIcon,
        title: 'Built in Vietnam, for Vietnam',
        body:
            'We understand local logistics, local payment habits, and the reality that most ' +
            'second-hand sales in Vietnam still happen through Facebook groups with zero protection. ' +
            'Go2Hand exists to change that — one verified listing at a time.',
    },
]

const MILESTONES = [
    { year: '2024', label: 'Founded in Ho Chi Minh City with a single goal: make second-hand tech safe.' },
    { year: 'Q1 2025', label: 'Launched IMEI verification and escrow payment for the first 500 listings.' },
    { year: 'Q2 2025', label: 'Reached 2,400+ active buyers and sellers across Vietnam.' },
    { year: 'Today', label: 'Thousands of verified devices listed, zero reported escrow fraud.' },
]

const STATS = [
    { value: '2,400+', label: 'Verified users' },
    { value: '0', label: 'Escrow fraud cases' },
    { value: '98%', label: 'Buyer satisfaction' },
    { value: '5%', label: 'Platform fee — nothing until you sell' },
]

// ─────────────────────────────────────────────────────────────────
export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-16 pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-4">
                        Our Story
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6">
                        Second-hand tech should be{' '}
                        <span className="text-teal-300">safe for everyone.</span>
                    </h1>
                    <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mx-auto">
                        Go2Hand was founded because buying a used phone in Vietnam felt like a gamble.
                        No verification. No protection. Just hope and a Facebook Messenger thread.
                        We decided to fix that.
                    </p>
                </div>
            </section>

            {/* ── STATS BAR ── */}
            <section className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {STATS.map(({ value, label }) => (
                            <div key={label} className="text-center">
                                <p className="text-3xl sm:text-4xl font-black text-teal-800 leading-none mb-1">
                                    {value}
                                </p>
                                <p className="text-sm text-gray-500 leading-snug">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── THE PROBLEM WE SOLVE ── */}
            <section className="py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">

                        {/* Left: story */}
                        <div>
                            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
                                Why we exist
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 leading-tight">
                                The second-hand market in Vietnam is huge.<br />
                                The trust layer isn't.
                            </h2>
                            <div className="space-y-4 text-gray-600 leading-relaxed">
                                <p>
                                    Vietnam has one of the highest smartphone upgrade rates in Southeast Asia.
                                    Millions of perfectly functional devices change hands every year — through
                                    Facebook groups, Zalo chats, and street-corner deals with no receipts and
                                    no recourse.
                                </p>
                                <p>
                                    Sellers don't always disclose real battery health. IMEI blacklists go
                                    unchecked. Buyers receive devices that don't match photos. Money disappears.
                                    Trust evaporates.
                                </p>
                                <p className="font-semibold text-gray-900">
                                    Go2Hand is the infrastructure the market was missing — verification,
                                    escrow, grading, and dispute resolution, all in one place.
                                </p>
                            </div>
                        </div>

                        {/* Right: before/after comparison */}
                        <div className="space-y-3">
                            {/* Before */}
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">
                                    Before Go2Hand
                                </p>
                                <ul className="space-y-2">
                                    {[
                                        'No IMEI check — stolen phones circulate freely',
                                        'Pay upfront, hope the device arrives as described',
                                        'No dispute process — buyer has no leverage',
                                        'Condition is whatever the seller claims',
                                    ].map(item => (
                                        <li key={item} className="flex items-start gap-2.5 text-sm text-red-700">
                                            <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* After */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">
                                    With Go2Hand
                                </p>
                                <ul className="space-y-2">
                                    {[
                                        'Every device IMEI-checked before listing',
                                        'Payment held in escrow until you approve',
                                        '5-day inspection window with dispute protection',
                                        'Standardised A+/A/B/C condition grading',
                                    ].map(item => (
                                        <li key={item} className="flex items-start gap-2.5 text-sm text-emerald-800">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── VALUES ── */}
            <section className="bg-white border-t border-b border-gray-100 py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[1160px] mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
                            What we believe
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                            Four principles we won't compromise on
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                        {VALUES.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-7
                  hover:border-teal-200 hover:bg-teal-50/30 transition-all duration-200"
                            >
                                <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                                    <Icon className="w-5 h-5 text-teal-700" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TIMELINE / MILESTONES ── */}
            <section className="py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[700px] mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
                            Our journey
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                            How we got here
                        </h2>
                    </div>

                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[22px] top-3 bottom-3 w-0.5 bg-gray-200" />

                        <div className="space-y-8">
                            {MILESTONES.map(({ year, label }, i) => (
                                <div key={year} className="flex items-start gap-5 relative">
                                    {/* Dot */}
                                    <div
                                        className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 z-10
                      ${i === MILESTONES.length - 1
                                                ? 'bg-teal-700 border-teal-700'
                                                : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <div
                                            className={`w-3 h-3 rounded-full
                        ${i === MILESTONES.length - 1 ? 'bg-white' : 'bg-gray-400'}`}
                                        />
                                    </div>
                                    <div className="pt-2 pb-2">
                                        <p
                                            className={`text-xs font-bold uppercase tracking-widest mb-1
                        ${i === MILESTONES.length - 1 ? 'text-teal-700' : 'text-gray-400'}`}
                                        >
                                            {year}
                                        </p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="bg-gradient-to-br from-teal-800 to-teal-700 py-14 sm:py-16 px-4 sm:px-6">
                <div className="max-w-[640px] mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                        Ready to buy or sell with confidence?
                    </h2>
                    <p className="text-teal-200 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                        Join thousands of buyers and sellers who no longer gamble on second-hand tech.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/devices"
                            className="inline-flex items-center justify-center gap-2 bg-white text-teal-800
                font-bold px-7 py-3.5 rounded-xl text-sm transition-all
                hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            Browse Verified Devices
                            <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/sell"
                            className="inline-flex items-center justify-center gap-2 bg-white/15
                hover:bg-white/25 border border-white/30 text-white font-semibold
                px-7 py-3.5 rounded-xl text-sm transition-all"
                        >
                            + Sell a Device
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}