// src/app/trust/page.tsx
// ─────────────────────────────────────────────────────────────────
// Trust & Safety Center — /trust
// Server Component — static marketing page showcasing Go2Hand's trust layer.
// Reuses standard layout components, HeroIcons, and SEO utilities.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    ShieldCheckIcon,
    LockClosedIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowRightIcon,
    DocumentTextIcon,
    FingerPrintIcon,
    ScaleIcon,
    CheckBadgeIcon,
    CpuChipIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'

export const metadata: Metadata = {
    title: buildTitle(['Trust & Safety Center', 'How We Protect Every Deal']),
    description: truncateDesc(
        'Explore the trust architecture behind Go2Hand: automated IMEI verification, ' +
        'ring-fenced escrow payments, objective condition grading, and zero fraud tolerance.'
    ),
    alternates: { canonical: `${SITE_URL}/trust` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/trust`,
        siteName: 'Go2Hand',
        title: 'Go2Hand Trust Center — Engineered for Zero Fraud',
        description: 'We built the verification layer Vietnam\'s second-hand tech market was missing.',
    },
}

// ── Data ──────────────────────────────────────────────────────────

const STATS = [
    { value: '100%', label: 'Escrow Ring-Fenced' },
    { value: '0', label: 'Reported Escrow Scams' },
    { value: '5 Days', label: 'Risk-Free Inspection' },
    { value: '24 hrs', label: 'Dispute Resolution SLA' },
]

const TRUST_PILLARS = [
    {
        icon: FingerPrintIcon,
        title: 'Automated IMEI Screening',
        body:
            'Before any phone listing goes live, its IMEI is scanned against global databases for ' +
            'reported thefts, unpaid carrier contracts, and manufacturer blacklists. Sketchy devices never make the feed.',
    },
    {
        icon: LockClosedIcon,
        title: 'Stripe-Powered Escrow',
        body:
            'When a buyer pays, funds are held in a secure, neutral holding account. The seller sees ' +
            'verified proof of funds but receives zero cash until the buyer inspects the item in real life and taps approve.',
    },
    {
        icon: DocumentTextIcon,
        title: 'Objective A+/A/B/C Grading',
        body:
            'We eliminated subjective claims like "99% new". Sellers must grade devices against strict, ' +
            'standardized cosmetic and functional rubrics. If the actual device falls short, the buyer gets a full refund.',
    },
    {
        icon: ScaleIcon,
        title: 'Human-Led Dispute Court',
        body:
            'Automated systems handle smooth deals; real humans handle the rough ones. If a dispute arises, ' +
            'our Trust & Safety team examines unboxing videos and shipment weights to issue binding rulings within 24 hours.',
    },
]

const FRAUD_PREVENTION = [
    {
        risk: 'Bait-and-switch shipping (sending bricks/broken phones)',
        solution: 'Mandatory carrier tracking integration & weight verification at drop-off points.',
    },
    {
        risk: 'Stolen or MDM-locked corporate devices',
        solution: 'Deep IMEI database checks blocking blacklisted serial numbers instantly.',
    },
    {
        risk: 'Off-platform payment scams (Zalo/Bank direct transfers)',
        solution: 'Strict UI warnings & zero buyer protection coverage for deals conducted outside escrow.',
    },
    {
        risk: 'False "defective item" claims by dishonest buyers',
        solution: 'Sellers are backed by mandatory unboxing video requirements before returns are authorized.',
    },
]

const TRUST_FAQS = [
    {
        q: 'How do you verify sellers before they list?',
        a: 'Every seller undergoes phone number OTP verification. For high-value devices, we monitor account age, past successful transaction volume, and community feedback scores.',
    },
    {
        q: 'What prevents a buyer from swapping parts during the 5-day window?',
        a: 'Sellers are advised to log internal device serial numbers and take continuous packaging photos. If internal tampering is detected upon return inspection, the dispute resolves 100% in the seller\'s favor.',
    },
    {
        q: 'Is my credit card data stored on Go2Hand servers?',
        a: 'Never. All payment processing, tokenization, and escrow holding are handled directly by Stripe. We only receive encrypted webhooks regarding transaction statuses.',
    },
]

// ─────────────────────────────────────────────────────────────────
export default function TrustPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-16 pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                        <ShieldSolid className="w-3.5 h-3.5 text-emerald-400" />
                        Trust & Safety Architecture
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                        We engineered the trust layer{' '}
                        <span className="text-teal-300">so you don&apos;t have to hope.</span>
                    </h1>
                    <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mx-auto">
                        In a second-hand market flooded with refurbished traps, hidden iCloud locks, and
                        disappearing sellers, Go2Hand serves as your verifiable, neutral source of truth.
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

            {/* ── CORE PILLARS ── */}
            <section className="py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[1160px] mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
                            The Foundation
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                            Four pillars protecting every transaction
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {TRUST_PILLARS.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm
                  hover:border-teal-200 hover:shadow-md transition-all duration-200"
                            >
                                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-5 border border-teal-100">
                                    <Icon className="w-6 h-6 text-teal-700" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── THREAT vs MITIGATION MATRIX ── */}
            <section className="bg-white border-t border-b border-gray-100 py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[900px] mx-auto">
                    <div className="mb-10">
                        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">
                            Proactive Defense
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
                            How we neutralize common marketplace scams
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Traditional classifieds leave fraud prevention entirely up to you. Here is how Go2Hand solves it at the system level:
                        </p>
                    </div>

                    <div className="space-y-4">
                        {FRAUD_PREVENTION.map(({ risk, solution }, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 items-center"
                            >
                                <div className="flex items-start gap-3">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Known Threat</span>
                                        <p className="text-sm font-bold text-gray-800 leading-snug">{risk}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 sm:border-l sm:border-gray-200 sm:pl-5 pt-2 sm:pt-0 border-t border-gray-200/60">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mb-0.5">Go2Hand Protocol</span>
                                        <p className="text-sm text-gray-600 leading-snug">{solution}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── COMMUNITY GUIDELINES STRIP ── */}
            <section className="py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto bg-gradient-to-br from-teal-900 to-teal-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
                    <CpuChipIcon className="w-64 h-64 text-white/5 absolute -right-10 -bottom-10 pointer-events-none" />

                    <div className="relative z-10 max-w-xl">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/15">
                            <CheckBadgeIcon className="w-5 h-5 text-teal-300" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black mb-4">
                            Trust is a two-way street.
                        </h2>
                        <p className="text-teal-100 text-sm leading-relaxed mb-6">
                            Our escrow systems protect your money, but safe commerce relies on honest buyers and sellers.
                            Review our platform etiquette to ensure your account remains in good standing.
                        </p>
                        <Link
                            href="/seller-guidelines"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-300 hover:text-white transition-colors"
                        >
                            Read Community Standards <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="bg-white border-t border-gray-100 py-16 sm:py-20 px-4 sm:px-6">
                <div className="max-w-[760px] mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Security FAQ</h2>
                    </div>

                    <div className="space-y-4">
                        {TRUST_FAQS.map(({ q, a }) => (
                            <div
                                key={q}
                                className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-teal-200 transition-colors"
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
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                        Experience risk-free second-hand tech.
                    </h2>
                    <p className="text-teal-200 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                        Browse verified listings backed by 100% money-back escrow protection today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/devices"
                            className="inline-flex items-center justify-center gap-2 bg-white text-teal-800
                font-bold px-7 py-3.5 rounded-xl text-sm transition-all
                hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            Browse Devices
                            <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/buyer-protection"
                            className="inline-flex items-center justify-center gap-2 bg-white/15
                hover:bg-white/25 border border-white/30 text-white font-semibold
                px-7 py-3.5 rounded-xl text-sm transition-all"
                        >
                            Buyer Protection Policy
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}