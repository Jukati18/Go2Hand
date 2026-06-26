// src/app/privacy/page.tsx
// ─────────────────────────────────────────────────────────────────
// Privacy Policy — /privacy
// Server Component — static content explaining Go2Hand's data practices.
// Adheres to the radical transparency principle and standard layout UI.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    ShieldCheckIcon,
    LockClosedIcon,
    EyeIcon,
    ServerIcon,
    KeyIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    EnvelopeIcon,
    FingerPrintIcon,
    BanknotesIcon,
    UserIcon,
    ShareIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { LockClosedIcon as LockSolid } from '@heroicons/react/24/solid'

export const metadata: Metadata = {
    title: buildTitle(['Privacy Policy', 'How We Protect Your Data']),
    description: truncateDesc(
        'Learn how Go2Hand collects, uses, and secures your personal information, IMEI data, ' +
        'and escrow transactions. Radical transparency applies to your privacy too.'
    ),
    alternates: { canonical: `${SITE_URL}/privacy` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/privacy`,
        siteName: 'Go2Hand',
        title: 'Go2Hand Privacy Policy — Your Data is Ring-Fenced',
        description: 'We build trust through radical transparency. Here is exactly what happens to your data.',
    },
}

// ── Data ──────────────────────────────────────────────────────────

const STATS = [
    { value: '0 bytes', label: 'Personal data sold to third parties' },
    { value: 'AES-256', label: 'Database & webhook encryption standard' },
    { value: 'Stripe', label: 'Exclusive payment tokenization handler' },
    { value: '100%', label: 'User control over account deletion' },
]

const PRIVACY_PILLARS = [
    {
        icon: EyeIcon,
        title: 'We collect only what we need',
        body:
            'We do not hoard behavioral browsing profiles. We collect your phone number for OTP verification, ' +
            'shipping addresses for device delivery, and device IMEIs to keep stolen goods off the marketplace.',
    },
    {
        icon: LockClosedIcon,
        title: 'Zero financial data storage',
        body:
            'Your credit card numbers, bank accounts, and escrow payouts bypass Go2Hand servers entirely. ' +
            'Stripe handles all payment tokenization, KYC checks, and ring-fenced fund holding.',
    },
    {
        icon: ShareIcon,
        title: 'No shady data brokers',
        body:
            'We will never sell, rent, or trade your personal information to advertising networks or third-party ' +
            'data aggregators. We make money from successful marketplace sales, not from monetizing your identity.',
    },
    {
        icon: KeyIcon,
        title: 'Absolute deletion rights',
        body:
            'If you decide to leave Go2Hand, you can request full account erasure. We wipe your profile, chat logs, ' +
            'and watchlist data immediately, retaining only legally mandated anti-fraud transaction records.',
    },
]

const DATA_COLLECTED = [
    {
        category: 'Account & Identity Data',
        examples: 'Full name, phone number (OTP verified), email address, encrypted password hash.',
        purpose: 'To authenticate access, prevent duplicate fraudulent accounts, and maintain platform trust.',
        sensitive: true,
    },
    {
        category: 'Device & Listing Data',
        examples: 'Smartphone IMEI numbers, serial numbers, unboxing videos, condition diagnostic photos.',
        purpose: 'To run automated blacklist screenings against global stolen phone databases.',
        sensitive: false,
    },
    {
        category: 'Transaction & Escrow Logs',
        examples: 'Order timestamps, inspection window approvals, dispute evidence submissions, shipping weights.',
        purpose: 'To resolve binding dispute claims and enforce our 5-day buyer protection policy.',
        sensitive: false,
    },
    {
        category: 'Logistics Information',
        examples: 'Delivery drop-off addresses, recipient phone numbers, carrier tracking numbers.',
        purpose: 'Shared strictly with verified sellers and delivery couriers to complete item fulfillment.',
        sensitive: true,
    },
]

const SUB_PROCESSORS = [
    {
        name: 'Stripe',
        role: 'Escrow Payment & Payout Infrastructure',
        location: 'Global (PCI-DSS Level 1 Certified)',
    },
    {
        name: 'Supabase',
        role: 'Database Hosting & Authentication Storage',
        location: 'Cloud Infrastructure (SOC2 Type II Compliant)',
    },
    {
        name: 'Vercel',
        role: 'Application Edge Hosting & CDN Routing',
        location: 'Global Edge Network',
    },
]

// ─────────────────────────────────────────────────────────────────
export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-16 pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                        <LockSolid className="w-3.5 h-3.5 text-emerald-400" />
                        Data Privacy Standards
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                        Radical transparency applies{' '}
                        <span className="text-teal-300">to your privacy too.</span>
                    </h1>
                    <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mx-auto">
                        When you trade second-hand tech on Go2Hand, you trust us with your money, your devices,
                        and your personal details. Here is an honest, plain-English breakdown of how we treat that data.
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

                {/* ── SECTION 1: CORE PILLARS ── */}
                <section>
                    <SectionLabel>Our Philosophy</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8 leading-tight">
                        Four promises regarding your personal data
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {PRIVACY_PILLARS.map(({ icon: Icon, title, body }) => (
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

                {/* ── SECTION 2: WHAT WE COLLECT ── */}
                <section>
                    <SectionLabel>Data Inventory</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        What information we collect &amp; why
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-2xl">
                        We categorize collected data into clear operational buckets. We never access your phone&apos;s
                        contacts, photo library (outside of uploaded proof files), or microphone.
                    </p>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {DATA_COLLECTED.map((item, idx) => (
                            <div
                                key={item.category}
                                className={`p-5 sm:p-6 border-b border-gray-100 last:border-b-0 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''
                                    }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <FingerPrintIcon className="w-4 h-4 text-teal-600 shrink-0" />
                                        <h3 className="text-sm font-bold text-gray-900">{item.category}</h3>
                                    </div>
                                    {item.sensitive && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full w-fit">
                                            Strictly Confidential
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-700 font-medium mb-1">
                                    <span className="text-gray-400">Data points:</span> {item.examples}
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    <span className="text-gray-400">Platform utility:</span> {item.purpose}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 3: THIRD PARTY PROCESSORS ── */}
                <section>
                    <SectionLabel>Infrastructure Partners</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Trusted sub-processors
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-2xl">
                        To maintain enterprise-grade escrow holding and database speed, we rely on industry-leading cloud infrastructure.
                        Each partner operates under strict Data Processing Agreements (DPAs).
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {SUB_PROCESSORS.map((sp) => (
                            <div key={sp.name} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <ServerIcon className="w-4 h-4 text-teal-700" />
                                    <p className="text-sm font-bold text-gray-900">{sp.name}</p>
                                </div>
                                <p className="text-xs font-semibold text-gray-700 mb-2">{sp.role}</p>
                                <p className="text-[11px] text-gray-400 leading-snug">{sp.location}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 4: DATA SECURITY & RETENTION ── */}
                <section>
                    <SectionLabel>Storage &amp; Retention</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-tight">
                        How we protect and purge your data
                    </h2>

                    <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-3">
                            <p className="font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                                Transmission &amp; At-Rest Encryption
                            </p>
                            <p>
                                All data moving between your client browser, Next.js application servers, and Supabase database
                                is encrypted via Transport Layer Security (TLS 1.3). Database snapshots and stored unboxing video files
                                are encrypted at rest using AES-256 block ciphers.
                            </p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-3">
                            <p className="font-bold text-gray-900 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                Anti-Fraud Retention Schedules
                            </p>
                            <p>
                                When a transaction completes successfully, inspection chat logs are purged after 90 days.
                                However, records associated with IMEI verification, escrow release ledgers, and formal dispute rulings
                                are retained for a minimum of 3 years to comply with Vietnamese digital commerce tax regulations
                                and to prevent repeat fraudulent actors from re-registering.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 5: YOUR RIGHTS ── */}
                <section>
                    <SectionLabel>Your Control</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 leading-tight">
                        Your privacy rights under Go2Hand
                    </h2>

                    <div className="bg-teal-900 text-white rounded-3xl p-7 sm:p-8 space-y-4">
                        <p className="text-sm text-teal-100 leading-relaxed">
                            Regardless of your exact municipality, we grant all active users the following baseline controls:
                        </p>

                        <ul className="space-y-2.5 text-xs sm:text-sm text-teal-50">
                            <li className="flex items-start gap-2.5">
                                <CheckCircleIcon className="w-4 h-4 text-teal-300 mt-0.5 shrink-0" />
                                <span><strong className="text-white">Right to Access:</strong> Download a JSON export of all listings, reviews, and account details tied to your phone number.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <CheckCircleIcon className="w-4 h-4 text-teal-300 mt-0.5 shrink-0" />
                                <span><strong className="text-white">Right to Rectification:</strong> Instantly update your display name, shipping addresses, or notification preferences inside your profile dashboard.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <CheckCircleIcon className="w-4 h-4 text-teal-300 mt-0.5 shrink-0" />
                                <span><strong className="text-white">Right to Erasure:</strong> Request permanent deletion of your account via Support. Upon verification, your profile is anonymized immediately.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* ── CTA CONTACT BANNER ── */}
                <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-md">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <EnvelopeIcon className="w-5 h-5 text-teal-300" />
                            <p className="text-sm font-bold text-white">Privacy Concerns or Data Requests?</p>
                        </div>
                        <p className="text-xs text-teal-200 leading-relaxed">
                            Our Data Protection Officer (DPO) and compliance team review all formal privacy inquiries within 48 hours.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                        <Link
                            href="/contact"
                            className="flex items-center justify-center gap-2 bg-white text-teal-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-teal-50 transition-all shadow-sm"
                        >
                            Contact DPO Support
                        </Link>
                    </div>
                </div>

                {/* ── LEGAL FOOTER NOTE ── */}
                <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-6">
                    <span className="font-semibold text-gray-500">Effective Date: June 2025.</span>{' '}
                    Go2Hand reserves the right to modify this Privacy Policy to reflect evolving technological infrastructure or
                    Vietnamese legal statutes. Significant modifications will be broadcasted via in-app banner notifications
                    at least 14 days prior to enforcement. For marketplace rules, review our{' '}
                    <Link href="/terms" className="text-teal-600 hover:underline">Terms of Service</Link> and{' '}
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