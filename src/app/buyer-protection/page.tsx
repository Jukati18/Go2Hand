// src/app/buyer-protection/page.tsx
// ─────────────────────────────────────────────────────────────────
// BUYER PROTECTION POLICY — /buyer-protection
//
// Static marketing/legal page. Server Component (no interactivity).
// Follows Go2Hand's visual language: teal hero, card sections,
// HeroIcons, Geist font via globals.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import {
    ShieldCheckIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    BanknotesIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ChatBubbleLeftEllipsisIcon,
    TruckIcon,
    ArrowPathIcon,
    LockClosedIcon,
    DocumentTextIcon,
    StarIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ── SEO Metadata ──────────────────────────────────────────────────
export const metadata: Metadata = {
    title: 'Buyer Protection Policy — Go2Hand',
    description:
        'Every purchase on Go2Hand is protected by escrow, IMEI verification, and a 5-day inspection window. Learn exactly how we keep your money safe.',
}

// ── Escrow timeline steps ─────────────────────────────────────────
const ESCROW_STEPS = [
    {
        icon: LockClosedIcon,
        step: '01',
        title: 'You pay — funds are held',
        desc: 'When you complete checkout, your money is ring-fenced in our secure escrow account. The seller receives nothing yet. Your card is charged, but the funds go nowhere until you say so.',
        color: 'teal',
    },
    {
        icon: TruckIcon,
        step: '02',
        title: 'Seller ships with tracking',
        desc: 'The seller is notified and must add a valid tracking number before the device leaves their hands. You can follow the shipment in real time from your dashboard.',
        color: 'blue',
    },
    {
        icon: MagnifyingGlassIcon,
        step: '03',
        title: '5-day inspection window',
        desc: 'Once delivered, you have 5 full days to inspect the device — check the screen, battery health, IMEI, all accessories, and anything else listed. There is no pressure to rush.',
        color: 'amber',
    },
    {
        icon: CheckCircleIcon,
        step: '04',
        title: 'Approve or dispute',
        desc: 'Happy with everything? Click "Approve" and the funds release to the seller. Something doesn\'t match? Open a dispute and our team steps in within 24 hours.',
        color: 'emerald',
    },
]

// ── What we verify on every device ───────────────────────────────
const VERIFICATIONS = [
    {
        icon: ShieldCheckIcon,
        title: 'IMEI blacklist check',
        desc: 'Every smartphone IMEI is cross-referenced against global stolen and blacklisted device databases before the listing goes live. A flagged IMEI cannot be published.',
    },
    {
        icon: DocumentTextIcon,
        title: 'Condition grading',
        desc: 'Sellers must select a condition grade (Like New / Excellent / Good / Fair) that matches standardised criteria. Misrepresenting condition is grounds for immediate suspension.',
    },
    {
        icon: LockClosedIcon,
        title: 'iCloud & carrier lock status',
        desc: 'Sellers are required to disclose whether the device is iCloud-locked or carrier-locked. A device listed as "Unlocked" must be fully unlocked at the time of sale.',
    },
    {
        icon: StarIcon,
        title: 'Seller trust score',
        desc: 'Every seller has a public rating built from verified buyer reviews. New sellers start with limited listing capacity and earn expanded privileges through positive transactions.',
    },
]

// ── Dispute resolution process ────────────────────────────────────
const DISPUTE_STEPS = [
    {
        n: 1,
        title: 'Open a dispute in-app',
        desc: 'During your 5-day inspection window, tap "Raise a Dispute" on your order page and describe the issue. Attach photos if the device condition differs from the listing.',
    },
    {
        n: 2,
        title: 'Go2Hand team reviews',
        desc: 'Our trust & safety team reviews the evidence within 24 hours. Both buyer and seller can submit documentation. We compare the original listing against what was received.',
    },
    {
        n: 3,
        title: 'Resolution issued',
        desc: 'We issue a binding decision: full refund, partial refund, or release of funds to seller. All decisions are final and applied immediately — no waiting for manual bank transfers.',
    },
]

// ── Refund scenarios ──────────────────────────────────────────────
const REFUND_SCENARIOS = [
    { covered: true,  text: 'Device condition significantly worse than listed grade' },
    { covered: true,  text: 'IMEI does not match listing or is blacklisted' },
    { covered: true,  text: 'Device is iCloud or carrier locked when listed as unlocked' },
    { covered: true,  text: 'Missing accessories that were explicitly listed' },
    { covered: true,  text: 'Device never arrives and tracking shows no movement for 7 days' },
    { covered: true,  text: 'Device is counterfeit or materially different from photos' },
    { covered: false, text: 'Change of mind after approving the device' },
    { covered: false, text: 'Buyer damage occurring after delivery' },
    { covered: false, text: 'Disputes raised after the 5-day window has closed' },
    { covered: false, text: 'Accessories not mentioned in the original listing' },
]

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────
export default function BuyerProtectionPage() {
    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-12 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                        <ShieldSolid className="w-3.5 h-3.5 text-emerald-400" />
                        Buyer Protection Policy
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight">
                        Your money doesn&apos;t move<br />
                        <span className="text-teal-300">until you say it does.</span>
                    </h1>

                    <p className="text-teal-100 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
                        Every purchase on Go2Hand is protected by escrow, IMEI verification, and a
                        5-day inspection window. If something isn&apos;t right, you get your money back.
                    </p>

                    {/* Trust stats */}
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                        {[
                            { value: '100%', label: 'Escrow protected' },
                            { value: '5 days', label: 'Inspection window' },
                            { value: '24 hrs', label: 'Dispute resolution' },
                            { value: '30 days', label: 'Return policy' },
                        ].map(({ value, label }) => (
                            <div key={label} className="text-center">
                                <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
                                <div className="text-xs text-teal-300 mt-0.5 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-10 sm:gap-14">

                {/* ── SECTION 1: How escrow works ── */}
                <section>
                    <SectionLabel>How escrow works</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Escrow holds your payment until you&apos;re satisfied
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Unlike bank transfers or direct payments where your money immediately leaves your control,
                        Go2Hand holds every payment in escrow — a neutral holding account — until the transaction
                        is verified complete on your end.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ESCROW_STEPS.map((s) => {
                            const Icon = s.icon
                            const colorMap: Record<string, string> = {
                                teal:    'bg-teal-50 text-teal-600 border-teal-100',
                                blue:    'bg-blue-50 text-blue-600 border-blue-100',
                                amber:   'bg-amber-50 text-amber-600 border-amber-100',
                                emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                            }
                            return (
                                <div key={s.step} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[s.color]}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                Step {s.step}
                                            </span>
                                            <p className="text-sm font-bold text-gray-900 mt-0.5 mb-1.5 leading-snug">{s.title}</p>
                                            <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Auto-release note */}
                    <div className="mt-4 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
                        <ClockIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-500 leading-relaxed">
                            <span className="font-semibold text-gray-700">Auto-release:</span>{' '}
                            If the inspection window expires without action, funds are automatically released to the seller.
                            We send reminder notifications at 48 hours, 24 hours, and 1 hour before expiry.
                        </p>
                    </div>
                </section>

                {/* ── SECTION 2: Verification ── */}
                <section>
                    <SectionLabel>Device verification</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Every device is checked before it reaches you
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Sellers on Go2Hand are required to pass a series of verification checks when listing a device.
                        Listings that fail these checks are removed immediately.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {VERIFICATIONS.map((v) => {
                            const Icon = v.icon
                            return (
                                <div key={v.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
                                        <Icon className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 mb-1">{v.title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* ── SECTION 3: What's covered ── */}
                <section>
                    <SectionLabel>Coverage details</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        What is and isn&apos;t covered
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Buyer protection covers material misrepresentation — situations where what you received
                        does not match what was listed. It does not cover personal preference or change-of-mind decisions.
                    </p>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header row */}
                        <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Scenario</p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Covered?</p>
                        </div>

                        {REFUND_SCENARIOS.map((row, i) => (
                            <div
                                key={i}
                                className={`grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                            >
                                <p className="text-sm text-gray-700 leading-snug">{row.text}</p>
                                {row.covered ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                                        <CheckCircleIcon className="w-3.5 h-3.5" />
                                        Covered
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                                        <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                                        Not covered
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 4: Dispute process ── */}
                <section>
                    <SectionLabel>Dispute resolution</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        If something&apos;s wrong, we step in fast
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Disputes are resolved within 24 hours. Our team reviews evidence from both parties
                        and issues a binding decision — no lengthy back-and-forth, no waiting weeks for a refund.
                    </p>

                    <div className="flex flex-col gap-4">
                        {DISPUTE_STEPS.map((s) => (
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

                {/* ── SECTION 5: Returns ── */}
                <section>
                    <SectionLabel>Returns</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        30-day return policy
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
                        Even after you approve a device, you have 30 days to return it if it develops a fault
                        that was not disclosed at the time of sale. This covers hidden defects — not physical damage
                        caused after delivery.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: ArrowPathIcon,
                                title: 'Hidden defects',
                                desc: 'Faults that could not be detected during the 5-day window (e.g. intermittent hardware failure) are eligible for return within 30 days.',
                            },
                            {
                                icon: DocumentTextIcon,
                                title: 'Simple process',
                                desc: 'Submit a return request via your order dashboard. We provide a prepaid return label in most cases. Refunds process within 3–5 business days.',
                            },
                            {
                                icon: ShieldCheckIcon,
                                title: 'No restocking fees',
                                desc: 'Go2Hand does not charge restocking fees on eligible returns. The full purchase price is refunded minus any non-refundable third-party fees.',
                            },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
                                    <Icon className="w-4 h-4 text-teal-600" />
                                </div>
                                <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 6: Tips for buyers ── */}
                <section>
                    <SectionLabel>Protect yourself</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Tips for a smooth purchase
                    </h2>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7">
                        <ul className="flex flex-col gap-4">
                            {[
                                'Read the full listing carefully — condition, IMEI status, accessories, and seller notes.',
                                'Check the seller\'s rating and review history before buying.',
                                'Inspect the device thoroughly on day one — don\'t wait until day 4 of the 5-day window.',
                                'Test every function: screen, buttons, speakers, charging port, cameras, cellular, and Wi-Fi.',
                                'Dial *#06# to confirm the IMEI on-screen matches the listing.',
                                'Take timestamped photos when you unbox — this protects you if a dispute arises.',
                                'Never agree to pay a seller outside the Go2Hand platform. Escrow protection only applies to in-app purchases.',
                            ].map((tip, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* ── CTA: contact / browse ── */}
                <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-teal-300" />
                            <p className="text-sm font-bold text-white">Questions? We&apos;re here.</p>
                        </div>
                        <p className="text-xs text-teal-200 leading-relaxed">
                            Can&apos;t find what you&apos;re looking for? Our trust &amp; safety team responds within a few hours.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                        <Link
                            href="/contact"
                            className="flex items-center justify-center gap-2 bg-white text-teal-800 font-bold text-sm px-5 py-3 rounded-xl hover:bg-teal-50 transition-all"
                        >
                            Contact Support
                        </Link>
                        <Link
                            href="/devices"
                            className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-white/20 transition-all"
                        >
                            Browse Devices
                        </Link>
                    </div>
                </div>

                {/* ── Legal footer note ── */}
                <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-6">
                    <span className="font-semibold text-gray-500">Last updated: June 2025.</span>{' '}
                    This policy applies to all purchases made through the Go2Hand platform. Go2Hand reserves the right to
                    update this policy at any time. Continued use of the platform constitutes acceptance of the current policy.
                    For legally binding terms, see our{' '}
                    <Link href="/terms" className="text-teal-600 hover:underline">Terms of Service</Link>.
                </p>
            </div>

            <Footer />
        </div>
    )
}

// ── Section label component ───────────────────────────────────────
// Small uppercase eyebrow above each section heading
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-2">
            {children}
        </p>
    )
}