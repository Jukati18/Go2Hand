// src/app/terms/page.tsx
// ─────────────────────────────────────────────────────────────────
// Terms of Service — /terms
// Server Component — legally binding rules for transacting on Go2Hand.
// Covers Escrow routing, the 5-day window, IMEI checks, and disputes.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    ScaleIcon,
    CurrencyDollarIcon,
    VideoCameraIcon,
    DevicePhoneMobileIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    EnvelopeIcon,
    ShieldExclamationIcon,
    ClockIcon,
} from '@heroicons/react/24/outline'
import { ScaleIcon as ScaleSolid } from '@heroicons/react/24/solid'

export const metadata: Metadata = {
    title: buildTitle(['Terms of Service', 'Marketplace Agreement']),
    description: truncateDesc(
        'Read Go2Hand’s binding Terms of Service. Clear rules on escrow funds, mandatory ' +
        'unboxing videos, the 5-day inspection window, and zero tolerance for stolen tech.'
    ),
    alternates: { canonical: `${SITE_URL}/terms` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/terms`,
        siteName: 'Go2Hand',
        title: 'Go2Hand Terms of Service — Clear Rules for Fair Trade',
        description: 'No hidden clauses. Here are the exact rules that govern our second-hand tech marketplace.',
    },
}

// ── Data ──────────────────────────────────────────────────────────

const STATS = [
    { value: '18+', label: 'Minimum age requirement to transact' },
    { value: '5 Days', label: 'Maximum escrow inspection window' },
    { value: '48 Hours', label: 'Required seller shipping deadline' },
    { value: 'Binding', label: 'Go2Hand admin dispute arbitration' },
]

const CORE_RULES = [
    {
        icon: DevicePhoneMobileIcon,
        title: '1. Truthful Representation',
        body:
            'Sellers must accurately disclose condition, battery health, and repair history. Listing a device ' +
            'with undisclosed third-party replacement screens or water damage constitutes commercial fraud.',
    },
    {
        icon: CurrencyDollarIcon,
        title: '2. Mandatory Escrow Routing',
        body:
            'All settlements must flow through Go2Hand checkout. Attempting to lure buyers off-platform to execute ' +
            'direct bank wire transfers results in an immediate, permanent account ban.',
    },
    {
        icon: VideoCameraIcon,
        title: '3. The Unboxing Video Rule',
        body:
            'Buyers must record a single, unedited video from the moment the sealed shipping label is cut ' +
            'to powering on the device. Without video evidence, physical damage claims are automatically rejected.',
    },
    {
        icon: ExclamationTriangleIcon,
        title: '4. Zero Stolen Goods Tolerance',
        body:
            'Every listed IMEI is screened against global blacklists. If a device is flagged as lost or stolen, ' +
            'the transaction is aborted, funds are frozen, and data is handed over to local law enforcement.',
    },
]

const OBLIGATIONS = [
    {
        role: 'Seller Responsibilities',
        badgeColor: 'text-blue-700 bg-blue-50 border-blue-100',
        rules: [
            'Factory reset the device and completely remove iCloud / Google FRP locks prior to packaging.',
            'Dispatch the item via our integrated courier network within 48 hours of order confirmation.',
            'Package the device with sufficient shock-absorbing bubble wrap to withstand standard transit drops.',
            'Record a continuous video showing the device working and being packed into the parcel.',
        ],
    },
    {
        role: 'Buyer Responsibilities',
        badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        rules: [
            'Be available to receive the parcel; excessive courier delivery failures forfeit return rights.',
            'Thoroughly inspect and test all hardware functions within the 5-day escrow window.',
            'Do NOT open internal hardware screws or visit third-party repair shops during the trial period.',
            'Press "Confirm Receipt" inside the dashboard promptly once satisfied to release the seller\'s payout.',
        ],
    },
]

const PROHIBITED_LISTINGS = [
    'Smartphones reported lost or stolen (IMEI / Serial blacklisted)',
    'Devices with active iCloud, Google FRP, or MDM (Mobile Device Management) corporate locks',
    'Counterfeit, cloned, or "Super Copy" replica hardware',
    'Devices containing swollen lithium batteries (severe transit fire hazard)',
    'Carrier-locked devices deceitfully advertised as "Factory International Unlocked"',
]

// ─────────────────────────────────────────────────────────────────
export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-16 pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                        <ScaleSolid className="w-3.5 h-3.5 text-emerald-400" />
                        Binding User Agreement
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                        Clear rules for fair trade.{' '}
                        <span className="text-teal-300">No shady business.</span>
                    </h1>
                    <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mx-auto">
                        By registering an account or executing a checkout on Go2Hand, you agree to abide by these
                        Terms of Service. Please read them carefully—they protect both your money and your gear.
                    </p>
                </div>
            </section>

            {/* ── STATS BAR ── */}
            <section className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {STATS.map(({ value, label }) => (
                            <div key={label} className="text-center">
                                <p className="text-2xl sm:text-3xl font-black text-teal-800 leading-none mb-1">
                                    {value}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 leading-snug">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col gap-12 sm:gap-16">

                {/* ── SECTION 1: CORE MARKETPLACE RULES ── */}
                <section>
                    <SectionLabel>The Golden Rules</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8 leading-tight">
                        Four non-negotiable marketplace laws
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {CORE_RULES.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm
                  hover:border-teal-200 transition-all duration-200"
                            >
                                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4 border border-teal-100">
                                    <Icon className="w-5 h-5 text-teal-700" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 2: SELLER VS BUYER OBLIGATIONS ── */}
                <section>
                    <SectionLabel>Accountability</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Your obligations during a transaction
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-2xl">
                        A safe marketplace requires effort from both sides. Failing to meet these specific duties
                        will shift dispute arbitration liabilities against you.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {OBLIGATIONS.map((party) => (
                            <div
                                key={party.role}
                                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border mb-4 ${party.badgeColor}`}>
                                        {party.role}
                                    </div>
                                    <ul className="space-y-3">
                                        {party.rules.map((rule, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
                                                <CheckCircleIcon className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                                                <span>{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 3: ESCROW & PAYOUT MECHANICS ── */}
                <section>
                    <SectionLabel>Financial Terms</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-tight">
                        Escrow holding and fee deductions
                    </h2>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 text-gray-600 text-sm leading-relaxed">
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-teal-700" />
                            The Payout Trigger Protocol
                        </p>
                        <p>
                            When a buyer purchases an item, the funds are debited and held in a secure Stripe escrow account.
                            The seller receives <strong className="text-gray-900">0 VND</strong> at this stage. Payouts are triggered
                            strictly under two conditions: (1) The buyer explicitly clicks <em className="text-teal-800 font-medium">Accept Device</em>,
                            or (2) Exactly <strong className="text-gray-900">120 hours (5 days)</strong> elapse after verified courier delivery
                            with zero dispute tickets filed.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs text-gray-500">
                            <strong className="text-gray-700">Platform Service Fee:</strong> Go2Hand deducts a transparent marketplace fee
                            (calculated at checkout based on listing category) from the seller’s final settlement. Failed deliveries caused by buyers
                            incur two-way return shipping deductions.
                        </div>
                    </div>
                </section>

                {/* ── SECTION 4: PROHIBITED ITEMS ── */}
                <section>
                    <SectionLabel>Strictly Banned</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Prohibited hardware listings
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-2xl">
                        Our automated AI moderation and manual inspection team actively scan listings. Publishing any of the following
                        will result in immediate listing deletion and potential account suspension.
                    </p>

                    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 sm:p-6 divide-y divide-gray-100">
                        {PROHIBITED_LISTINGS.map((item, idx) => (
                            <div key={idx} className="py-3.5 flex items-start gap-3 first:pt-0 last:pb-0">
                                <XCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <span className="text-xs sm:text-sm font-medium text-gray-800">{item}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 5: DISPUTE & ARBITRATION ── */}
                <section>
                    <SectionLabel>Disputes</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-tight">
                        Binding arbitration rulings
                    </h2>

                    <div className="bg-teal-900 text-white rounded-3xl p-7 sm:p-8 space-y-4">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                            <ShieldExclamationIcon className="w-5 h-5" />
                            <span>Go2Hand Admin Rulings Are Final</span>
                        </div>
                        <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                            If a buyer opens a return ticket within the 5-day window, escrow release is halted.
                            Go2Hand compliance officers will examine: (a) The listing description &amp; diagnostic photos,
                            (b) The seller&apos;s packing video, and (c) The buyer&apos;s unboxing video.
                        </p>
                        <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                            By using Go2Hand, both parties explicitly agree that the compliance officer&apos;s verdict
                            regarding full refund, partial refund, or dispute rejection is <strong className="text-white underline decoration-teal-400">legally binding</strong>.
                            Unjustified chargebacks filed directly through credit card issuers will result in permanent platform blacklisting.
                        </p>
                    </div>
                </section>

                {/* ── CTA CONTACT BANNER ── */}
                <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-md">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <EnvelopeIcon className="w-5 h-5 text-teal-300" />
                            <p className="text-sm font-bold text-white">Need Clarification on Marketplace Terms?</p>
                        </div>
                        <p className="text-xs text-teal-200 leading-relaxed">
                            If you are unsure whether your specific device condition complies with our listing rules, ask us first.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                        <Link
                            href="/contact"
                            className="flex items-center justify-center gap-2 bg-white text-teal-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-teal-50 transition-all shadow-sm"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>

                {/* ── LEGAL FOOTER NOTE ── */}
                <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-6">
                    <span className="font-semibold text-gray-500">Effective Date: June 2025.</span>{' '}
                    Go2Hand is operated under the jurisdiction of the Socialist Republic of Vietnam. Any legal claims outside our
                    internal dispute protocol must be brought before the competent courts of Ho Chi Minh City. For data handling specifics,
                    please read our{' '}
                    <Link href="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link> and{' '}
                    <Link href="/buyer-protection" className="text-teal-600 hover:underline">Buyer Protection Policy</Link>.
                </p>

            </div>

            <Footer />
        </div>
    )
}

// ── Section label helper component ────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-2">
            {children}
        </p>
    )
}