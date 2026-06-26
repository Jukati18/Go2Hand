// src/app/fees/page.tsx
// ─────────────────────────────────────────────────────────────────
// FEES & PRICING POLICY — /fees
//
// Server Component — static content, marketing & transparency page.
// Explains Go2Hand's flat 5% seller fee, zero buyer fee, shipping costs,
// and withdrawal timelines.
//
// Visual language follows existing pages: 
// buyer-protection, seller-guidelines, get-verified.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    TagIcon,
    BanknotesIcon,
    ShieldCheckIcon,
    ScaleIcon,
    TruckIcon,
    BuildingLibraryIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    CurrencyDollarIcon,
    LockClosedIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline'
import { BanknotesIcon as BanknotesSolid } from '@heroicons/react/24/solid'

// ── SEO Metadata ──────────────────────────────────────────────────
export const metadata: Metadata = {
    title: buildTitle(['Fees & Pricing Structure', 'Transparent Marketplace Fees']),
    description: truncateDesc(
        'Go2Hand charges a simple, flat 5% fee on completed sales only. Listing is free, ' +
        'buying is free, and escrow protection is included at zero extra cost.'
    ),
    alternates: { canonical: `${SITE_URL}/fees` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/fees`,
        siteName: 'Go2Hand',
        title: 'Fees & Pricing Structure — Go2Hand',
        description: '100% transparent pricing. See exactly how our escrow marketplace operates.',
    },
}

// ── Fee Breakdown Examples Data ───────────────────────────────────
const SELLER_FEE_EXAMPLES = [
    { tier: 'Budget Smartphone', price: '2,000,000 ₫', fee: '100,000 ₫', payout: '1,900,000 ₫' },
    { tier: 'Mid-range Tablet', price: '7,500,000 ₫', fee: '375,000 ₫', payout: '7,125,000 ₫' },
    { tier: 'Flagship Device', price: '15,000,000 ₫', fee: '750,000 ₫', payout: '14,250,000 ₫' },
    { tier: 'High-end Laptop', price: '28,000,000 ₫', fee: '1,400,000 ₫', payout: '26,600,000 ₫' },
]

// ── What the 5% Fee Covers ────────────────────────────────────────
const WHAT_FEE_COVERS = [
    {
        icon: LockClosedIcon,
        title: 'Secure Escrow Holding',
        desc: 'Partnering with licensed banking institutions to ring-fence buyer funds securely until inspection is approved.',
    },
    {
        icon: ShieldCheckIcon,
        title: 'IMEI Anti-Theft Checks',
        desc: 'Every smartphone listed is queried against global stolen and blacklisted device registries before publication.',
    },
    {
        icon: ScaleIcon,
        title: '24h Dispute Mediation',
        desc: 'Access to dedicated human trust & safety agents who review unboxing evidence and issue binding resolutions fast.',
    },
    {
        icon: CurrencyDollarIcon,
        title: 'Payment Gateway Absorption',
        desc: 'We absorb all underlying banking, credit card, ATM, and VietQR payment gateway processing fees.',
    },
]

// ── Comparison Data ───────────────────────────────────────────────
const MARKET_COMPARISON = [
    {
        channel: 'Go2Hand Platform',
        cost: '5% flat fee',
        risk: 'Zero scam risk (Escrow protected)',
        payout: '95% of market value',
        highlight: true,
    },
    {
        channel: 'Traditional Pawn / Trade-in Stores',
        cost: '20% – 35% margin loss',
        risk: 'Low risk, but heavily undervalued',
        payout: '65% – 80% of market value',
        highlight: false,
    },
    {
        channel: 'Unregulated Social Groups (FB, Chợ Tốt)',
        cost: '0% upfront',
        risk: 'Extreme risk (Bait-and-switch, fake receipts)',
        payout: 'Uncertain / High scam rate',
        highlight: false,
    },
]

// ── FAQs Data ─────────────────────────────────────────────────────
const FAQS = [
    {
        q: 'What happens if a buyer returns the device during the inspection window?',
        a: 'If a return is officially approved due to undisclosed hardware defects, 100% of the funds are refunded to the buyer. You are charged 0₫ in platform fees.',
    },
    {
        q: 'Are there any monthly subscription fees for store owners?',
        a: 'No. Whether you are a casual seller listing 1 phone or a Verified Seller managing 50 active listings, platform access is completely free.',
    },
    {
        q: 'Do I pay a fee to withdraw my balance to my bank account?',
        a: 'Standard domestic bank transfers (NAPAS 24/7) to registered Vietnamese bank accounts are processed 100% free of charge.',
    },
    {
        q: 'Who pays the delivery and courier shipping fee?',
        a: 'Shipping fees are calculated dynamically at checkout based on carrier rates (J&T, GHTK, ViettelPost) and are paid separately by the buyer.',
    },
]

// ─────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function FeesPage() {
    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-12 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center sm:text-left">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                        <BanknotesSolid className="w-3.5 h-3.5 text-amber-400" />
                        Platform Fee Structure
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight">
                        Simple, honest pricing.<br />
                        <span className="text-teal-300">No hidden deductions. Ever.</span>
                    </h1>

                    <p className="text-teal-100 text-base sm:text-lg leading-relaxed max-w-xl mb-10">
                        We believe a second-hand marketplace should only make money when its users 
                        successfully make money. That is why listing is free, buying is free, and our 
                        flat fee is only collected when a deal completes.
                    </p>

                    {/* Quick stats banner */}
                    <div className="flex flex-wrap gap-6 sm:gap-10 justify-center sm:justify-start">
                        {[
                            { value: '0 ₫', label: 'To list any device' },
                            { value: '5%', label: 'Flat fee on successful sales' },
                            { value: '0 ₫', label: 'Buyer escrow fee' },
                            { value: 'Free', label: 'Domestic bank withdrawals' },
                        ].map(({ value, label }) => (
                            <div key={label} className="text-center sm:text-left">
                                <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
                                <div className="text-xs text-teal-300 mt-0.5 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAIN CONTENT CONTAINER ── */}
            <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-12 sm:gap-16">

                {/* ─────────────────────────────────────────────
                    SECTION 1: Core Principles
                ───────────────────────────────────────────── */}
                <section>
                    <SectionLabel>01 / The Golden Rule</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        How Go2Hand fees work
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Unlike traditional classifieds where you pay upfront for visibility, or retail trade-ins 
                        that slash 30% off your device value, Go2Hand aligns our success entirely with yours.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: TagIcon,
                                title: '1. List for Free',
                                desc: 'Publishing your device with diagnostic specs and IMEI verification costs 0₫. Unsold listings expire naturally at zero cost.',
                            },
                            {
                                icon: SparklesIcon,
                                title: '2. Buy for Free',
                                desc: 'Buyers pay the exact listed item price plus carrier shipping. Comprehensive escrow payment hold is included automatically.',
                            },
                            {
                                icon: BanknotesIcon,
                                title: '3. 5% Seller Success Fee',
                                desc: 'When the buyer approves the device, a 5% fee is deducted from the escrow hold before releasing the remaining 95% to your bank.',
                            },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
                                <div>
                                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-4 text-teal-700 font-bold">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 mb-2">{title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 2: Seller Fee Calculation
                ───────────────────────────────────────────── */}
                <section>
                    <SectionLabel>02 / Seller Payouts</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Transparent payout calculator
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
                        Here is exactly what hits your bank account across different device price tiers. 
                        There are no extra transfer charges or hidden tax surcharges.
                    </p>

                    {/* Calculation Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                        <div className="grid grid-cols-4 px-5 sm:px-6 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>Category Tier</span>
                            <span className="text-right">Sale Price</span>
                            <span className="text-right">5% Fee</span>
                            <span className="text-right">Your Net Payout</span>
                        </div>

                        {SELLER_FEE_EXAMPLES.map((row, i) => (
                            <div 
                                key={row.tier} 
                                className={`grid grid-cols-4 px-5 sm:px-6 py-4 items-center text-sm border-b border-gray-50 last:border-b-0 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                            >
                                <span className="font-medium text-gray-700 truncate pr-2">{row.tier}</span>
                                <span className="text-right font-semibold text-gray-900">{row.price}</span>
                                <span className="text-right text-red-500 font-medium">-{row.fee}</span>
                                <span className="text-right font-bold text-teal-700">{row.payout}</span>
                            </div>
                        ))}
                    </div>

                    {/* What the fee covers block */}
                    <h3 className="text-lg font-bold text-gray-900 mb-4">What does the 5% platform fee cover?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {WHAT_FEE_COVERS.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
                                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 3: Market Comparison
                ───────────────────────────────────────────── */}
                <section>
                    <SectionLabel>03 / Value Comparison</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Why 5% is the smartest deal in tech
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        When selling second-hand electronics, you typically have to choose between convenience 
                        and getting fair market value. Go2Hand bridges that gap.
                    </p>

                    <div className="flex flex-col gap-4">
                        {MARKET_COMPARISON.map((item, i) => (
                            <div 
                                key={i} 
                                className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                                    item.highlight 
                                        ? 'bg-teal-900 text-white border-teal-800 shadow-md' 
                                        : 'bg-white text-gray-800 border-gray-100 shadow-sm'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-base font-black ${item.highlight ? 'text-white' : 'text-gray-900'}`}>
                                                {item.channel}
                                            </p>
                                            {item.highlight && (
                                                <span className="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    Recommended
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs ${item.highlight ? 'text-teal-200' : 'text-gray-500'}`}>
                                            {item.risk}
                                        </p>
                                    </div>

                                    <div className="flex sm:flex-col justify-between sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100/20 shrink-0">
                                        <div className="text-xs sm:text-right">
                                            <span className={`block text-[10px] uppercase font-bold tracking-wider ${item.highlight ? 'text-teal-300' : 'text-gray-400'}`}>Fee Cut</span>
                                            <span className={`font-black text-sm ${item.highlight ? 'text-emerald-400' : 'text-red-600'}`}>{item.cost}</span>
                                        </div>
                                        <div className="text-xs text-right sm:mt-1">
                                            <span className={`block text-[10px] uppercase font-bold tracking-wider ${item.highlight ? 'text-teal-300' : 'text-gray-400'}`}>Net Value</span>
                                            <span className="font-bold">{item.payout}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 4: Logistics & Banking
                ───────────────────────────────────────────── */}
                <section>
                    <SectionLabel>04 / Banking & Shipping</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Zero logistics surcharges
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
                            <div className="flex items-center gap-3">
                                <BuildingLibraryIcon className="w-6 h-6 text-blue-600 shrink-0" />
                                <h3 className="font-bold text-gray-900 text-base">Bank Withdrawals</h3>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Once funds are released from escrow, payouts are transferred directly to your registered 
                                domestic bank account via NAPAS 24/7 network. Go2Hand absorbs 100% of inter-bank transfer fees.
                            </p>
                            <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Processing time: 1 – 3 business days</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
                            <div className="flex items-center gap-3">
                                <TruckIcon className="w-6 h-6 text-amber-600 shrink-0" />
                                <h3 className="font-bold text-gray-900 text-base">Carrier Delivery</h3>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Shipping is strictly peer-to-peer. The buyer pays shipping costs upfront during checkout. 
                                We generate integrated waybills with J&T Express and ViettelPost to ensure exact standard weight pricing.
                            </p>
                            <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>No platform markup on courier labels</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 5: FAQs
                ───────────────────────────────────────────── */}
                <section>
                    <SectionLabel>Got questions?</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-6 leading-tight">
                        Frequently asked questions
                    </h2>

                    <div className="flex flex-col gap-4">
                        {FAQS.map(({ q, a }) => (
                            <div key={q} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                                <p className="text-sm font-bold text-gray-900 mb-1.5 flex items-start gap-2.5">
                                    <InformationCircleIcon className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                                    <span>{q}</span>
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed pl-6.5">{a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── BOTTOM CTA ── */}
                <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-1">
                            Ready to turn your unused devices into cash?
                        </p>
                        <p className="text-xs text-teal-200 leading-relaxed">
                            List your first device today. Remember: you pay absolutely nothing until your item 
                            is safely delivered and approved by the buyer.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                        <Link
                            href="/sell"
                            className="flex items-center justify-center gap-2 bg-white text-teal-800 font-bold text-sm px-6 py-3 rounded-xl hover:bg-teal-50 transition-all"
                        >
                            <TagIcon className="w-4 h-4" />
                            List a Device Now
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
                    All fee calculations are displayed in Vietnamese Đồng (VNĐ) and include applicable statutory taxes. 
                    Go2Hand reserves the right to modify promotional commission rates with prior notice to merchants. 
                    For binding legal obligations, read our{' '}
                    <Link href="/terms" className="text-teal-600 hover:underline">Terms of Service</Link>.
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