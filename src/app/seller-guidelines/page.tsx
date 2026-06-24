// src/app/seller-guidelines/page.tsx
// ─────────────────────────────────────────────────────────────────
// SELLER GUIDELINES — /seller-guidelines
//
// Server Component — static content, no data fetching needed.
// Covers everything a seller needs to know: listing rules,
// condition grading standards, shipping requirements, prohibited
// items, fee structure, and account health.
//
// Visual language follows the existing page family:
// about/page.tsx, buyer-protection/page.tsx, how-it-works/page.tsx
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    CameraIcon,
    CurrencyDollarIcon,
    TruckIcon,
    StarIcon,
    ExclamationTriangleIcon,
    TagIcon,
    ClockIcon,
    UserCircleIcon,
    DocumentTextIcon,
    BanknotesIcon,
    ArrowRightIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'

// ── SEO Metadata ──────────────────────────────────────────────────
export const metadata: Metadata = {
    title: buildTitle(['Seller Guidelines', 'How to Sell on Go2Hand']),
    description: truncateDesc(
        'Everything you need to know to sell on Go2Hand — listing rules, condition grading ' +
        'standards, shipping requirements, prohibited items, fees, and account policies.'
    ),
    alternates: { canonical: `${SITE_URL}/seller-guidelines` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/seller-guidelines`,
        siteName: 'Go2Hand',
        title: 'Seller Guidelines — Go2Hand',
        description: 'List with confidence. Here\'s exactly how Go2Hand expects sellers to operate.',
    },
}

// ── Condition grade definitions ───────────────────────────────────
const CONDITION_GRADES = [
    {
        grade: 'A+',
        label: 'Like New',
        badge: 'bg-emerald-500',
        criteria: [
            'No scratches, dents, or marks under any lighting',
            'Screen is flawless — no dead pixels, no micro-scratches',
            'Battery health 95% or above',
            'All original accessories present (box, charger, cable)',
            'Never dropped; ideally kept in a case since purchase',
        ],
        note: 'Original packaging is not required but strongly increases buyer confidence and sale price.',
    },
    {
        grade: 'A',
        label: 'Excellent',
        badge: 'bg-teal-500',
        criteria: [
            'Light micro-scratches only visible under direct harsh light',
            'No cracks, dents, or marks visible in normal use',
            'Screen in excellent condition — no dead pixels',
            'Battery health 85% or above',
            'Fully functional — all buttons, ports, and speakers work',
        ],
        note: 'The most common grade for devices used carefully for 1–2 years.',
    },
    {
        grade: 'B',
        label: 'Good',
        badge: 'bg-blue-500',
        criteria: [
            'Visible light scratches on the back or frame in normal lighting',
            'Minor corner wear acceptable — no cracks',
            'Screen must be free of cracks and dead pixels',
            'Battery health 75% or above',
            'All functions working normally',
        ],
        note: 'Be transparent about which specific areas show wear — buyers appreciate honesty and it reduces disputes.',
    },
    {
        grade: 'C',
        label: 'Fair',
        badge: 'bg-amber-500',
        criteria: [
            'Noticeable cosmetic damage: scratches, scuffs, or minor dents',
            'Screen must be crack-free even if it shows wear',
            'Battery health 65% or above',
            'All core functions working — minor issues must be disclosed',
            'Heavy wear on body is acceptable if accurately described',
        ],
        note: 'Fair devices sell well when priced appropriately and photographed honestly. Never grade a cracked-screen device as Fair — that requires explicit disclosure.',
    },
]

// ── Photo requirements ────────────────────────────────────────────
const REQUIRED_PHOTOS = [
    { label: 'Front — screen off', desc: 'Shows the full display and bezel in natural light.' },
    { label: 'Front — screen on', desc: 'Confirms no dead pixels, burn-in, or screen damage.' },
    { label: 'Back', desc: 'Shows the full rear panel, camera module, and any wear.' },
    { label: 'Left and right sides', desc: 'Reveals frame condition, buttons, and ports.' },
    { label: 'Bottom edge', desc: 'Shows charging port, speaker grille, and SIM tray.' },
    { label: 'Any damage', desc: 'Required if any scratches, dents, or marks are present. Close-up.' },
    { label: 'IMEI / serial on screen', desc: 'Dial *#06# and photograph the result. Confirms identity.' },
    { label: 'Battery health screenshot', desc: 'For smartphones: Settings → Battery → Battery Health.' },
]

// ── Prohibited items ──────────────────────────────────────────────
const PROHIBITED = [
    'Devices with cracked or broken screens (unless disclosed as "screen replacement required" with adjusted pricing)',
    'Devices reported as stolen or with flagged IMEIs',
    'iCloud-locked devices listed as "iCloud unlocked"',
    'Carrier-locked devices listed as "fully unlocked"',
    'Counterfeit, grey-import, or unofficial devices',
    'Devices with non-original components not disclosed (battery replacements, screen replacements)',
    'Items outside our device categories: no clothing, food, non-tech items',
    'Listings with stock photos instead of real device photos',
    'Duplicate listings for the same physical device',
    'Devices with modified firmware or jailbreaks not disclosed',
]

// ── Shipping rules ────────────────────────────────────────────────
const SHIPPING_RULES = [
    {
        icon: ClockIcon,
        title: 'Ship within 48 hours',
        desc: 'Once a buyer pays and escrow is confirmed, you have 48 hours to ship the device and enter a valid tracking number. Delays beyond this may result in order cancellation.',
    },
    {
        icon: TruckIcon,
        title: 'Use a tracked carrier',
        desc: 'All shipments must use a carrier that provides a tracking number: J&T Express, ViettelPost, GHTK, GHN, or Ninja Van. Cash-on-delivery is not accepted for Go2Hand orders.',
    },
    {
        icon: ShieldCheckIcon,
        title: 'Package devices securely',
        desc: 'Use bubble wrap and a rigid box. Phones should be in a protective sleeve. If the device arrives damaged due to poor packaging, you bear responsibility in any dispute.',
    },
    {
        icon: CameraIcon,
        title: 'Photograph before shipping',
        desc: 'Take a photo of the packaged device and the completed shipping label before handing it to the carrier. This is your strongest protection in a damage or "wrong item" dispute.',
    },
    {
        icon: DocumentTextIcon,
        title: 'Enter tracking promptly',
        desc: 'Add the carrier name and tracking number in your order dashboard as soon as you have it. Buyers are notified instantly and can track the shipment themselves.',
    },
]

// ── Fee structure ─────────────────────────────────────────────────
const FEE_EXAMPLES = [
    { salePrice: 500, fee: 25, payout: 475 },
    { salePrice: 800, fee: 40, payout: 760 },
    { salePrice: 1200, fee: 60, payout: 1140 },
    { salePrice: 200, fee: 10, payout: 190 },
]

// ── Account health signals ────────────────────────────────────────
const HEALTH_SIGNALS = [
    { good: true, text: 'Accurate condition grading — listing matches what buyers receive' },
    { good: true, text: 'Shipping within 48 hours of escrow confirmation' },
    { good: true, text: 'Responding to buyer messages within 2 hours' },
    { good: true, text: 'Accurate battery health disclosures' },
    { good: true, text: 'Clear, well-lit real photos of the actual device' },
    { good: false, text: 'Listing a B-grade device as A+ to get a higher price' },
    { good: false, text: 'Shipping after the 48-hour window without notifying the buyer' },
    { good: false, text: 'Failing to disclose a replacement battery or screen' },
    { good: false, text: 'Duplicate listings for the same device' },
    { good: false, text: 'Asking buyers to complete the transaction outside Go2Hand' },
]

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────
export default function SellerGuidelinesPage() {
    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-12 sm:pt-16 pb-14 sm:pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                        <TagIcon className="w-3.5 h-3.5 text-amber-400" />
                        Seller Guidelines
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight">
                        Sell with confidence.
                        <br />
                        <span className="text-teal-300">These rules protect you too.</span>
                    </h1>

                    <p className="text-teal-100 text-base sm:text-lg leading-relaxed max-w-xl mb-10">
                        Go2Hand is built on trust. These guidelines aren&apos;t legal fine print — they&apos;re
                        the practical rules that make buyers confident enough to pay your asking price without
                        meeting you in person.
                    </p>

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-6 sm:gap-10">
                        {[
                            { value: 'Free', label: 'To list a device' },
                            { value: '5%', label: 'Fee on completed sales only' },
                            { value: '48 hrs', label: 'To ship after escrow confirms' },
                            { value: '5 min', label: 'Average listing time' },
                        ].map(({ value, label }) => (
                            <div key={label} className="text-center sm:text-left">
                                <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
                                <div className="text-xs text-teal-300 mt-0.5 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TABLE OF CONTENTS ── */}
            <div className="max-w-[860px] mx-auto px-4 sm:px-6 pt-8 pb-2">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        In this guide
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            { n: '01', label: 'Listing requirements', anchor: '#listing' },
                            { n: '02', label: 'Condition grading standards', anchor: '#condition' },
                            { n: '03', label: 'Photo requirements', anchor: '#photos' },
                            { n: '04', label: 'Prohibited items & behaviours', anchor: '#prohibited' },
                            { n: '05', label: 'Shipping rules', anchor: '#shipping' },
                            { n: '06', label: 'Fees & payouts', anchor: '#fees' },
                            { n: '07', label: 'Account health', anchor: '#health' },
                            { n: '08', label: 'Disputes & appeals', anchor: '#disputes' },
                        ].map(({ n, label, anchor }) => (
                            <a
                                key={n}
                                href={anchor}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                    hover:bg-teal-50 hover:text-teal-800 text-gray-600
                                    transition-colors text-sm group"
                            >
                                <span className="text-[10px] font-black text-gray-300 group-hover:text-teal-400 w-5">
                                    {n}
                                </span>
                                {label}
                                <ArrowRightIcon className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 text-teal-500 transition-opacity" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-12 sm:gap-16">

                {/* ─────────────────────────────────────────────
                    SECTION 1: Listing Requirements
                ───────────────────────────────────────────── */}
                <section id="listing">
                    <SectionLabel>01</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Listing requirements
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Every listing on Go2Hand must meet these baseline requirements before it goes live.
                        Listings that don&apos;t meet the standard are removed without notice.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            {
                                icon: ShieldCheckIcon,
                                title: 'IMEI or serial number verified',
                                desc: 'Smartphones must pass an IMEI blacklist check. Laptops and tablets require a serial number verification. A clean result is mandatory before publishing.',
                            },
                            {
                                icon: CameraIcon,
                                title: 'Minimum 5 real photos',
                                desc: 'Photos must be of the actual device you are selling — no stock images, no renders. Minimum 5 photos covering all required angles. Full requirements in Section 03.',
                            },
                            {
                                icon: DocumentTextIcon,
                                title: 'Accurate title and specs',
                                desc: 'The title must match the device exactly: brand, model, storage, colour. Specs like RAM, display, and chip are auto-filled from our database — don\'t change them to mislead buyers.',
                            },
                            {
                                icon: StarIcon,
                                title: 'Honest condition grade',
                                desc: 'Select the grade (A+/A/B/C) that honestly describes the device. Grading a B device as A+ to achieve a higher price is a policy violation and grounds for removal.',
                            },
                            {
                                icon: BanknotesIcon,
                                title: 'Realistic asking price',
                                desc: 'Our pricing tool shows you market rates for comparable listings. Prices significantly above market (price gouging) are flagged for review.',
                            },
                            {
                                icon: InformationCircleIcon,
                                title: 'Full disclosure of known issues',
                                desc: 'Any fault, repair history, or limitation must be stated in the description — a replaced screen, a sticky button, intermittent charging. If the buyer discovers it and you didn\'t disclose it, you lose the dispute.',
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

                {/* ─────────────────────────────────────────────
                    SECTION 2: Condition Grading
                ───────────────────────────────────────────── */}
                <section id="condition">
                    <SectionLabel>02</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Condition grading standards
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Go2Hand uses four grades. Use the one that honestly describes your device — not the
                        highest one you think you can get away with. Buyers who receive a device worse than
                        listed will open disputes, and verified misgrading results in account suspension.
                    </p>

                    <div className="flex flex-col gap-4">
                        {CONDITION_GRADES.map(({ grade, label, badge, criteria, note }) => (
                            <div key={grade} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Grade header */}
                                <div className="flex items-center gap-4 px-5 sm:px-6 py-4 border-b border-gray-100">
                                    <div className={`w-11 h-11 rounded-xl ${badge} flex items-center justify-center text-white font-black text-base shrink-0`}>
                                        {grade}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-gray-900">{label}</p>
                                        <p className="text-xs text-gray-400">Grade {grade}</p>
                                    </div>
                                </div>

                                {/* Criteria */}
                                <div className="px-5 sm:px-6 py-4">
                                    <ul className="flex flex-col gap-2 mb-4">
                                        {criteria.map(item => (
                                            <li key={item} className="flex items-start gap-2.5">
                                                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <p className="text-sm text-gray-600 leading-snug">{item}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    {/* Note */}
                                    <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3">
                                        <InformationCircleIcon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-gray-500 leading-relaxed">{note}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Cracked screen callout */}
                    <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-red-800 mb-1">Cracked screens require explicit disclosure</p>
                            <p className="text-xs text-red-700 leading-relaxed">
                                A device with a cracked screen cannot be listed under any standard grade. It must be
                                listed as &quot;Cracked Screen&quot; in the title, graded C, and photographed clearly.
                                Failure to disclose a cracked screen results in an automatic dispute loss and temporary suspension.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 3: Photo Requirements
                ───────────────────────────────────────────── */}
                <section id="photos">
                    <SectionLabel>03</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Photo requirements
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Photos are the primary reason buyers trust a listing. Good photos sell devices faster
                        at higher prices. Bad photos — or photos that don&apos;t match the device — are the primary
                        cause of disputes.
                    </p>

                    {/* Required shots */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                        <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900">Required shots</p>
                            <p className="text-xs text-gray-400 mt-0.5">Minimum 5 of these must be present</p>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {REQUIRED_PHOTOS.map(({ label, desc }, i) => (
                                <div key={label} className={`flex items-start gap-4 px-5 sm:px-6 py-4 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                                    <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-[10px] font-black text-teal-700">{i + 1}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 leading-snug">{label}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Photo dos and don'ts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">
                                ✓ Good photos
                            </p>
                            <ul className="flex flex-col gap-2">
                                {[
                                    'Natural daylight or neutral indoor lighting',
                                    'Clean, plain background (white or grey)',
                                    'Device fills most of the frame',
                                    'Sharp focus — no blur',
                                    'Unfiltered — no beauty filters or colour grading',
                                    'Shows actual scratches and wear clearly',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-emerald-800">
                                        <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-3">
                                ✗ Not allowed
                            </p>
                            <ul className="flex flex-col gap-2">
                                {[
                                    'Stock photos or manufacturer renders',
                                    'Photos of a different device of the same model',
                                    'Heavy filters that hide scratches or discolouration',
                                    'Photos that conceal damage with a case or finger',
                                    'Screenshots of product listings from other sites',
                                    'Photos where the IMEI is deliberately hidden',
                                ].map(item => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-red-700">
                                        <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 4: Prohibited Items
                ───────────────────────────────────────────── */}
                <section id="prohibited">
                    <SectionLabel>04</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Prohibited items & behaviours
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        The following cannot be listed or done on Go2Hand. Violations result in immediate
                        listing removal; repeat violations result in account suspension.
                    </p>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-50">
                            {PROHIBITED.map((item, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-4 px-5 sm:px-6 py-4 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                                >
                                    <XCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700 leading-snug">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Off-platform warning */}
                    <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-800 mb-1">
                                Never ask buyers to pay outside Go2Hand
                            </p>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Attempting to move a transaction off-platform — to Zalo Pay, bank transfer, or cash —
                                is an immediate permanent ban. Buyers lose their escrow protection when this happens,
                                and our team actively monitors for it. Report any buyer who asks you to do this as well.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 5: Shipping Rules
                ───────────────────────────────────────────── */}
                <section id="shipping">
                    <SectionLabel>05</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Shipping rules
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Reliable shipping is the biggest driver of positive reviews. Sellers who ship fast,
                        package well, and communicate clearly close deals faster and earn better ratings.
                    </p>

                    <div className="flex flex-col gap-4">
                        {SHIPPING_RULES.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex gap-4">
                                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 text-teal-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Lost-in-transit note */}
                    <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                        <InformationCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-blue-800 mb-1">What happens if a package is lost?</p>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                If tracking shows no movement for 7 days after handoff to the carrier, the buyer
                                can open a dispute. Go2Hand will request the carrier&apos;s handoff receipt from you.
                                Always get a proof-of-postage receipt from the carrier — it&apos;s the only way to demonstrate
                                you fulfilled your shipping obligation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 6: Fees & Payouts
                ───────────────────────────────────────────── */}
                <section id="fees">
                    <SectionLabel>06</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Fees &amp; payouts
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Listing is always free. Go2Hand charges a single 5% platform fee on completed sales.
                        If a sale doesn&apos;t complete — because the buyer disputes, cancels, or the listing
                        expires — you pay nothing.
                    </p>

                    {/* Fee breakdown table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                        <div className="grid grid-cols-3 px-5 sm:px-6 py-3 bg-gray-50 border-b border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sale price</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Platform fee (5%)</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Your payout</p>
                        </div>
                        {FEE_EXAMPLES.map(({ salePrice, fee, payout }, i) => (
                            <div key={salePrice} className={`grid grid-cols-3 px-5 sm:px-6 py-4 ${i % 2 === 1 ? 'bg-gray-50/40' : ''} border-b border-gray-50 last:border-b-0`}>
                                <p className="text-sm font-semibold text-gray-900">${salePrice}</p>
                                <p className="text-sm text-red-500 font-medium text-center">-${fee}</p>
                                <p className="text-sm font-bold text-teal-700 text-right">${payout}</p>
                            </div>
                        ))}
                    </div>

                    {/* Payout timing */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: CheckCircleIcon,
                                title: 'When is payment released?',
                                desc: 'When the buyer approves the device, or when the 5-day inspection window closes without a dispute — whichever comes first.',
                            },
                            {
                                icon: CurrencyDollarIcon,
                                title: 'How long does payout take?',
                                desc: 'Go2Hand processes seller payouts within 1–3 business days after payment is released from escrow.',
                            },
                            {
                                icon: BanknotesIcon,
                                title: 'How do I receive payment?',
                                desc: 'Payouts are sent to your registered bank account. Set up your payout details in Settings → Payouts before your first sale.',
                            },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                                    <Icon className="w-4 h-4 text-emerald-600" />
                                </div>
                                <p className="text-sm font-bold text-gray-900 mb-1">{title}</p>
                                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 7: Account Health
                ───────────────────────────────────────────── */}
                <section id="health">
                    <SectionLabel>07</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Account health
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Your account health score determines your listing visibility, capacity, and
                        eligibility for the Verified Seller badge. It&apos;s calculated from your dispute rate,
                        shipping speed, and buyer reviews.
                    </p>

                    {/* Health signals table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                        {HEALTH_SIGNALS.map(({ good, text }, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-4 px-5 sm:px-6 py-4 border-b border-gray-50 last:border-b-0 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                            >
                                {good ? (
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                ) : (
                                    <XCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
                                )}
                                <p className="text-sm text-gray-700">{text}</p>
                                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                    {good ? 'Builds trust' : 'Hurts score'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Verified seller */}
                    <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-5 sm:p-6 flex gap-4 items-start">
                        <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                            <ShieldSolid className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white mb-1">Verified Seller badge</p>
                            <p className="text-xs text-teal-200 leading-relaxed mb-4">
                                Verified Sellers are reviewed by the Go2Hand team for listing accuracy, shipping reliability,
                                and dispute history. The badge unlocks higher listing capacity and preferred placement in search results.
                            </p>
                            <Link
                                href="/get-verified"
                                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30
                                    text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                            >
                                Apply for verification
                                <ArrowRightIcon className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ─────────────────────────────────────────────
                    SECTION 8: Disputes & Appeals
                ───────────────────────────────────────────── */}
                <section id="disputes">
                    <SectionLabel>08</SectionLabel>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight">
                        Disputes &amp; appeals
                    </h2>
                    <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
                        Disputes are rare when listings are accurate and shipping is prompt. When they do happen,
                        here&apos;s how the process works and what you can do to protect yourself.
                    </p>

                    <div className="flex flex-col gap-4 mb-5">
                        {[
                            {
                                n: 1,
                                icon: ExclamationTriangleIcon,
                                title: 'Buyer opens a dispute',
                                desc: 'The buyer submits a description and photos. Payment remains in escrow — no money moves in either direction while the dispute is open.',
                                tip: 'You are notified immediately and have 24 hours to submit your response and evidence.',
                            },
                            {
                                n: 2,
                                icon: DocumentTextIcon,
                                title: 'Submit your evidence',
                                desc: 'Upload your pre-shipment photos, the original listing photos, your carrier\'s proof of postage, and any messages with the buyer that support your position.',
                                tip: 'This is why pre-shipment photos matter. Without them, disputes are very hard to win if the buyer claims damage.',
                            },
                            {
                                n: 3,
                                icon: UserCircleIcon,
                                title: 'Go2Hand reviews',
                                desc: 'Our team reviews the listing, both sets of evidence, and the device photos within 24 hours. We compare what was listed against what was received.',
                                tip: 'Decisions are final. The stronger your evidence, the better your outcome.',
                            },
                            {
                                n: 4,
                                icon: ShieldCheckIcon,
                                title: 'Resolution issued',
                                desc: 'If the listing was accurate and the device was as described, payment is released to you. If there was misrepresentation, the buyer is refunded.',
                                tip: 'Sellers who win disputes have their account score protected. Sellers who lose repeated disputes face listing suspension.',
                            },
                        ].map(({ n, icon: Icon, title, desc, tip }) => (
                            <div key={n} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex gap-4 sm:gap-5">
                                <div className="shrink-0 flex flex-col items-center">
                                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-1">
                                        <Icon className="w-5 h-5 text-teal-700" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-300">{n}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 mb-1.5">{title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{desc}</p>
                                    <div className="flex items-start gap-2 bg-teal-50 border border-teal-100 rounded-xl px-3.5 py-2.5">
                                        <InformationCircleIcon className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-teal-700 font-medium leading-snug">{tip}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Appeals */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 sm:px-6 py-5">
                        <p className="text-sm font-bold text-gray-900 mb-2">Appealing a decision</p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            If you believe a dispute was decided incorrectly, you can submit an appeal within
                            7 days of the decision by contacting our trust team at{' '}
                            <a href="mailto:trust@go2hand.vn" className="text-teal-600 hover:underline font-medium">
                                trust@go2hand.vn
                            </a>
                            {' '}with new evidence. Appeals are reviewed within 48 hours. Decisions on appeals are final.
                            Note: appeals without new evidence are not reconsidered.
                        </p>
                    </div>
                </section>

                {/* ── QUICK REFERENCE CARD ── */}
                <section>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900">Quick reference — the rules in brief</p>
                            <p className="text-xs text-gray-400 mt-0.5">Save this and refer to it before listing</p>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {[
                                ['Listing fee', 'Free — always'],
                                ['Platform fee', '5% of sale price, charged on completion only'],
                                ['Minimum photos', '5 required, 8–10 recommended'],
                                ['IMEI check', 'Required for all smartphones before publishing'],
                                ['Shipping window', '48 hours from escrow confirmation'],
                                ['Carriers accepted', 'J&T, ViettelPost, GHTK, GHN, Ninja Van'],
                                ['Inspection window', '5 days for the buyer after delivery'],
                                ['Dispute response time', '24 hours to submit your evidence'],
                                ['Payout timing', '1–3 business days after approval'],
                                ['Cracked screens', 'Must be disclosed in title and photos'],
                            ].map(([field, value]) => (
                                <div key={field} className="grid grid-cols-[auto_1fr] gap-6 px-5 sm:px-6 py-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap w-40">
                                        {field}
                                    </p>
                                    <p className="text-xs text-gray-700 font-medium">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-1">
                            Ready to list your first device?
                        </p>
                        <p className="text-xs text-teal-200 leading-relaxed">
                            It takes less than 5 minutes. Our form guides you through every step — IMEI check,
                            condition grading, and pricing — so you can publish with confidence.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                        <Link
                            href="/sell"
                            className="flex items-center justify-center gap-2 bg-white text-teal-800
                                font-bold text-sm px-6 py-3 rounded-xl hover:bg-teal-50 transition-all"
                        >
                            <TagIcon className="w-4 h-4" />
                            List a Device
                        </Link>
                        <Link
                            href="/how-it-works"
                            className="flex items-center justify-center gap-2 bg-white/10 border border-white/20
                                text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/20 transition-all"
                        >
                            How Escrow Works →
                        </Link>
                    </div>
                </div>

                {/* ── Legal footer ── */}
                <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-6">
                    <span className="font-semibold text-gray-500">Last updated: June 2025.</span>{' '}
                    These guidelines apply to all sellers on the Go2Hand platform. Go2Hand reserves the right to
                    update these guidelines at any time. Continued use of the platform constitutes acceptance.
                    For legally binding terms, see our{' '}
                    <Link href="/terms" className="text-teal-600 hover:underline">Terms of Service</Link>.
                </p>
            </div>

            <Footer />
        </div>
    )
}

// ── Reusable section label component ─────────────────────────────
// The small numbered eyebrow above each section heading.
// Uses opacity and tracking to sit quietly without competing with the h2.
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[11px] font-black text-teal-600 uppercase tracking-widest mb-2">
            {children}
        </p>
    )
}