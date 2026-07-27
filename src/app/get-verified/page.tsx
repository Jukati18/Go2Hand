// src/app/get-verified/page.tsx
// ─────────────────────────────────────────────────────────────────
// VERIFIED SELLER PROGRAM — /get-verified
//
// Static marketing/policy landing page. Server Component.
// Explains the Verified Seller program: benefits, eligibility criteria,
// application steps, and compliance rules.
//
// Follows Go2Hand's visual language: teal hero, card grids, 
// HeroIcons, Geist font via globals.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    ShieldCheckIcon,
    SparklesIcon,
    ArrowTrendingUpIcon,
    ClockIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    IdentificationIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'

// ── SEO Metadata ──────────────────────────────────────────────────
export const metadata: Metadata = {
    title: buildTitle(['Get Verified', 'Verified Seller Program']),
    description: truncateDesc(
        'Join the Go2Hand Verified Seller program. Unlock 3x listing capacity, ' +
        'priority placement in search results, and earn the trust badge buyers look for.'
    ),
    alternates: { canonical: `${SITE_URL}/get-verified` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/get-verified`,
        siteName: 'Go2Hand',
        title: 'Verified Seller Program — Go2Hand',
        description: 'Earn the badge buyers trust. Sell faster, list more.',
    },
}

// ── Program Benefits ──────────────────────────────────────────────
const BENEFITS = [
    {
        icon: ArrowTrendingUpIcon,
        title: '3x Active Listing Limit',
        desc: 'Standard accounts can list up to 5 devices at once. Verified Sellers can maintain up to 50 active listings simultaneously.',
    },
    {
        icon: SparklesIcon,
        title: 'Priority Search Ranking',
        desc: 'Verified listings are automatically boosted to the top tiers of category browse pages and buyer search results.',
    },
    {
        icon: ShieldCheckIcon,
        title: 'The Trust Shield Badge',
        desc: 'Your profile, device cards, and chat window display the Verified Shield — eliminating buyer hesitation instantly.',
    },
    {
        icon: ClockIcon,
        title: 'Fast-Track Escrow Payouts',
        desc: 'Maintain a flawless track record to become eligible for accelerated 24-hour fund releases upon buyer delivery.',
    },
]

// ── Eligibility Benchmark Checklist ───────────────────────────────
const ELIGIBILITY_CRITERIA = [
    { passed: true, text: 'Account registered on Go2Hand for at least 30 days' },
    { passed: true, text: 'Minimum 3 completed sales with positive buyer reviews' },
    { passed: true, text: 'Overall public seller rating of 4.8 stars or higher' },
    { passed: true, text: 'Zero unresolved or lost buyer disputes in the past 60 days' },
    { passed: true, text: '100% on-time shipping record (handed to carrier within 48 hours)' },
    { passed: true, text: 'Government ID (CCCD/Passport) verified matching bank account name' },
]

// ── Application Steps ─────────────────────────────────────────────
const APPLICATION_STEPS = [
    {
        n: 1,
        title: 'Submit your request',
        desc: 'Navigate to Profile → Verification Settings and complete the short merchant declaration form. It takes less than 2 minutes.',
    },
    {
        n: 2,
        title: 'Identity cross-check',
        desc: 'Our trust & safety team securely cross-references your uploaded Government ID against your registered bank payout details.',
    },
    {
        n: 3,
        title: 'Store & chat audit',
        desc: 'We review your historical listing photos, grading accuracy, packaging feedback, and responsiveness to buyer chat inquiries.',
    },
    {
        n: 4,
        title: 'Badge activated',
        desc: 'Once approved, your badge goes live instantly across the entire platform and your listing capacity expands automatically.',
    },
]

// ── FAQs ──────────────────────────────────────────────────────────
const FAQS = [
    {
        q: 'Does getting verified cost money?',
        a: 'No. The application, review process, and maintenance of the Verified Seller badge are 100% free. We only succeed when you make sales.',
    },
    {
        q: 'Can individual casual sellers apply, or just stores?',
        a: 'Individual sellers are warmly welcomed! You do not need a registered business tax ID — just a proven track record of 3 successful sales on Go2Hand.',
    },
    {
        q: 'What happens if my application is rejected?',
        a: 'You will receive an email detailing the exact criteria that were not met. You are free to re-apply after 30 days once the issues are resolved.',
    },
]

// ─────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function GetVerifiedPage() {
    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-12 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                        <ShieldSolid className="w-3.5 h-3.5 text-amber-400" />
                        Verified Seller Program
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight">
                        Earn the badge buyers trust.<br />
                        <span className="text-teal-300">Sell faster. List more.</span>
                    </h1>

                    <p className="text-teal-100 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
                        In a second-hand market, trust is the ultimate currency. The Verified Seller badge 
                        tells buyers you are a proven, audited merchant — making them confident enough 
                        to buy without hesitation.
                    </p>

                    {/* Quick stats */}
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                        {[
                            { value: 'Free', label: 'Application cost' },
                            { value: '50', label: 'Active listings limit' },
                            { value: 'Top', label: 'Search placement' },
                            { value: '48 hrs', label: 'Avg. review time' },
                        ].map(({ value, label }) => (
                            <div key={label} className="text-center">
                                <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
                                <div className="text-xs text-teal-300 mt-0.5 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-12 sm:gap-16">

                {/* ── SECTION 1: Benefits ── */}
                <section>
                    <SectionLabel>Why apply</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        What the Verified badge unlocks for you
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Verification isn&apos;t just a cosmetic icon next to your name. It fundamentally 
                        changes how the Go2Hand platform treats and promotes your listings.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {BENEFITS.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                <div className="w-10 h-10 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-center mb-3">
                                    <Icon className="w-5 h-5 text-teal-600" />
                                </div>
                                <p className="text-sm font-bold text-gray-900 mb-1.5">{title}</p>
                                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 2: Eligibility Criteria ── */}
                <section>
                    <SectionLabel>Benchmarks</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Check your eligibility
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        To protect the integrity of the badge, we hold Verified Sellers to a strict standard. 
                        Ensure your account meets these 6 benchmarks before submitting an application.
                    </p>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Requirement</p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Benchmark</p>
                        </div>

                        {ELIGIBILITY_CRITERIA.map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <p className="text-sm text-gray-700 leading-snug">{item.text}</p>
                                </div>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                                    Required
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                        <InformationCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <span className="font-semibold">New seller?</span> Don&apos;t worry if you haven&apos;t reached 3 sales yet. 
                            Focus on shipping your first few orders quickly and taking honest listing photos. We will notify you automatically the moment you become eligible.
                        </p>
                    </div>
                </section>

                {/* ── SECTION 3: Application Process ── */}
                <section>
                    <SectionLabel>How it works</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        4 steps to get verified
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Our trust &amp; safety team reviews every single application manually. Here is what 
                        happens behind the scenes once you tap submit.
                    </p>

                    <div className="flex flex-col gap-4">
                        {APPLICATION_STEPS.map((s) => (
                            <div key={s.n} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex items-start gap-5">
                                <div className="w-10 h-10 rounded-full bg-teal-800 text-white flex items-center justify-center text-sm font-black shrink-0">
                                    {s.n}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 mb-1">{s.title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 4: Do's & Don'ts (Accountability) ── */}
                <section>
                    <SectionLabel>Accountability</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Keeping the badge
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Verification is an ongoing privilege, not a permanent achievement. Verified Sellers 
                        undergo automated monthly health checks. Here is how sellers keep or lose their badge:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">
                                ✓ To maintain your badge
                            </p>
                            <ul className="flex flex-col gap-2.5">
                                {[
                                    'Maintain an overall rating above 4.7 stars',
                                    'Ship 100% of orders within the 48h window',
                                    'Respond to buyer chat messages within 2 hours',
                                    'Grade cosmetic wear strictly by the book',
                                    'Package devices in rigid boxes with bubble wrap',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-emerald-800 leading-relaxed">
                                        <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3">
                                ✗ Instant badge revocation
                            </p>
                            <ul className="flex flex-col gap-2.5">
                                {[
                                    'Attempting to move payments outside Go2Hand',
                                    'Losing 2 condition disputes within 90 days',
                                    'Using stock imagery or reusing old listing photos',
                                    'Failing to disclose replaced screens or batteries',
                                    'Cancelling paid orders due to sudden price changes',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-red-700 leading-relaxed">
                                        <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 5: FAQs block ── */}
                <section>
                    <SectionLabel>Got questions?</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6 leading-tight">
                        Frequently asked questions
                    </h2>

                    <div className="flex flex-col gap-4">
                        {FAQS.map(({ q, a }) => (
                            <div key={q} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                <p className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-2">
                                    <InformationCircleIcon className="w-4 h-4 text-teal-600 shrink-0" />
                                    {q}
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed pl-6">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── BOTTOM CTA ── */}
                <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-1">
                            Ready to take your store to the next level?
                        </p>
                        <p className="text-xs text-teal-200 leading-relaxed">
                            Check your account dashboard right now to see if you meet the 3-sale threshold. 
                            Our team is standing by to review your application.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                        <Link
                            href="/dashboard/settings/verification"
                            className="flex items-center justify-center gap-2 bg-white text-teal-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-teal-50 transition-all"
                        >
                            <IdentificationIcon className="w-4 h-4" />
                            Apply Now
                        </Link>
                        <Link
                            href="/seller-guidelines"
                            className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/20 transition-all"
                        >
                            Seller Guidelines →
                        </Link>
                    </div>
                </div>

                {/* ── Legal footer note ── */}
                <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-6">
                    <span className="font-semibold text-gray-500">Last updated: June 2025.</span>{' '}
                    Go2Hand reserves the right to grant, reject, or revoke Verified Seller status at its sole discretion 
                    based on platform safety signals. For detailed policy rules, review our{' '}
                    <Link href="/seller-guidelines" className="text-teal-600 hover:underline">Seller Guidelines</Link>.
                </p>
            </div>

            <Footer />
        </div>
    )
}

// ── Reusable Section Label Eyebrow ────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-2">
            {children}
        </p>
    )
}