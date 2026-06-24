// src/app/faq/page.tsx
// ─────────────────────────────────────────────────────────────────
// FAQ Page — /faq
//
// Structure:
//   • Teal hero with search-style eyebrow and summary stats
//   • Category nav pills (sticky on desktop, horizontal scroll mobile)
//   • Accordion sections per category — click to expand/collapse
//   • Each answer uses Go2Hand's trust language (escrow, IMEI, etc.)
//   • CTA banner at the bottom linking to Support
//
// Implemented as a Client Component so accordion state works
// without a full page reload. All SEO metadata is exported from
// this file via the `metadata` export at the top — Next.js merges
// it into the <head> automatically for Server-rendered pages.
// Since this page has 'use client', SEO metadata should live in a
// sibling layout.tsx (see note below). For now it is exported here
// as a named export as a dev convenience; move to layout.tsx before
// production if strict SSR metadata is required.
// ─────────────────────────────────────────────────────────────────

'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
    ChevronDownIcon,
    ShieldCheckIcon,
    TruckIcon,
    CreditCardIcon,
    DevicePhoneMobileIcon,
    UserCircleIcon,
    StarIcon,
    ChatBubbleLeftEllipsisIcon,
    MagnifyingGlassIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ─────────────────────────────────────────────────────────────────
// DATA — FAQ categories and questions
// ─────────────────────────────────────────────────────────────────

interface FaqItem {
    q: string
    a: string | React.ReactNode
}

interface FaqCategory {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string          // Tailwind bg colour class for the icon chip
    iconColor: string      // Tailwind text colour class for the icon
    items: FaqItem[]
}

const FAQ_CATEGORIES: FaqCategory[] = [
    // ── 1. Buying ─────────────────────────────────────────────────
    {
        id: 'buying',
        label: 'Buying',
        icon: DevicePhoneMobileIcon,
        color: 'bg-teal-50',
        iconColor: 'text-teal-600',
        items: [
            {
                q: 'How do I know the device I receive will match the listing?',
                a: 'Every listing on Go2Hand requires the seller to provide: an honest condition grade (Like New / Excellent / Good / Fair), battery health percentage, IMEI status, iCloud lock status, and carrier lock status. These fields are not free-text — they are standardised checkboxes. Misrepresentation is grounds for an immediate dispute and refund. You also have a 5-day inspection window after delivery to verify everything in person before your money releases.',
            },
            {
                q: 'Is it safe to pay online? What if I get scammed?',
                a: 'Your payment goes into an escrow account — not directly to the seller. The seller receives nothing until you inspect the device and tap "Approve." If the device doesn\'t match the listing, you open a dispute and your payment is cancelled. Funds never move without your explicit action. Go2Hand uses Stripe for payment processing, which is the same infrastructure used by Amazon, Shopify, and most major e-commerce platforms.',
            },
            {
                q: 'What is the 5-day inspection window?',
                a: 'From the moment you confirm delivery on the Go2Hand app, a 5-day countdown begins. During this time you can inspect the device at your own pace — test the screen, battery, cameras, cellular, buttons, and any accessories. If everything checks out, tap "Approve" and payment releases to the seller. If something is wrong, open a dispute before the 5 days expire. After 5 days with no action, payment releases automatically.',
            },
            {
                q: 'What happens if the seller never ships?',
                a: 'If the seller doesn\'t add a tracking number within 3 business days of payment, you can cancel the order from your dashboard. The Stripe authorisation is cancelled and no charge is made to your card. Sellers who repeatedly fail to ship have their accounts reviewed and may be suspended.',
            },
            {
                q: 'Can I negotiate the price with the seller?',
                a: 'Yes. Use the "Make an Offer" button on any listing to propose a price. The seller can accept, decline, or counter. All negotiation happens inside Go2Hand — if you agree on a price, the checkout updates automatically. Never agree to pay outside the platform; you lose all escrow protection if you do.',
            },
            {
                q: 'Can I buy from any city in Vietnam?',
                a: 'Yes. Go2Hand is open to all buyers across Vietnam. Sellers ship via J&T Express, ViettelPost, GHTK, GHN, Ninja Van, or equivalent carriers. Typical delivery takes 2–4 business days. Shipping is free on all Go2Hand listings.',
            },
            {
                q: 'Is there a buyer fee?',
                a: 'No. Go2Hand is completely free for buyers. The 5% platform fee is charged to sellers only, and only when a sale completes successfully.',
            },
        ],
    },

    // ── 2. Selling ────────────────────────────────────────────────
    {
        id: 'selling',
        label: 'Selling',
        icon: StarIcon,
        color: 'bg-amber-50',
        iconColor: 'text-amber-600',
        items: [
            {
                q: 'How do I list a device?',
                a: 'Go to /sell, sign in, and follow the 4-step form: (1) pick a category and brand, (2) select your model — specs auto-fill from our database, (3) upload at least 5 photos and run the IMEI/Serial check, (4) set your price. The whole process takes under 5 minutes. Listing is free.',
            },
            {
                q: 'How much does Go2Hand charge?',
                a: 'Listing is always free. Go2Hand charges a 5% platform fee only when a sale completes. For a ₫5,000,000 sale, you keep ₫4,750,000. There are no subscription fees, listing fees, or hidden charges.',
            },
            {
                q: 'When do I receive my payment?',
                a: 'Payment is held in escrow from the moment the buyer checks out. It releases to your Go2Hand balance after the buyer approves the device — or after the 5-day inspection window expires with no dispute. Once released, the funds are transferred to your linked bank account within 1–3 business days.',
            },
            {
                q: 'Do I have to ship immediately?',
                a: 'You should ship within 3 business days of receiving confirmed payment. The escrow dashboard in your seller panel shows a countdown. If you need more time, message the buyer. Sellers who repeatedly delay shipment may have their listing privileges restricted.',
            },
            {
                q: 'What condition grade should I choose?',
                a: 'Choose honestly. Grade A+ (Like New) is for devices with no visible wear and ideally in original packaging. Grade A (Excellent) is for devices with only micro-scratches. Grade B (Good) is for normal everyday wear. Grade C (Fair) is for noticeable scratches or cosmetic damage. Misgrading a device is the most common cause of disputes — and disputes are resolved against dishonest sellers.',
            },
            {
                q: 'Can I sell locked (iCloud/carrier) devices?',
                a: 'You can list a device that is iCloud-locked or carrier-locked, but you must disclose this accurately in the listing. Listing a locked device as "Unlocked" is misrepresentation and will result in a full refund to the buyer and possible account suspension.',
            },
            {
                q: 'How many photos do I need to upload?',
                a: 'A minimum of 5 photos is required. We recommend 8–10: front, back, both sides, screen on (at full brightness), any scratches or blemishes close-up, and the original box if included. Listings with more photos sell significantly faster and receive fewer disputes.',
            },
        ],
    },

    // ── 3. Escrow & Payments ──────────────────────────────────────
    {
        id: 'escrow',
        label: 'Escrow & Payments',
        icon: CreditCardIcon,
        color: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        items: [
            {
                q: 'What exactly is escrow?',
                a: 'Escrow is a neutral holding account. When you buy on Go2Hand, your payment is authorised on your card but not captured — meaning the money is reserved but hasn\'t gone anywhere. It sits in escrow until you approve the device, at which point it is captured and transferred to the seller. If a dispute is resolved in your favour, the authorisation is cancelled and no money ever changes hands.',
            },
            {
                q: 'How long can my money be held in escrow?',
                a: 'Stripe (our payment processor) can hold an authorisation for up to 7 days. Our entire flow — shipping and the 5-day inspection window — is designed to complete within that limit. In edge cases (courier delays, disputes), our trust & safety team extends the hold manually.',
            },
            {
                q: 'What payment methods are accepted?',
                a: 'Go2Hand accepts all major credit and debit cards (Visa, Mastercard, JCB), as well as digital wallets like Apple Pay and Google Pay, via Stripe. Local Vietnamese bank transfers and VNPAY integration are on the roadmap.',
            },
            {
                q: 'Is my card data stored on Go2Hand?',
                a: 'No. Your card details are handled entirely by Stripe and never touch Go2Hand\'s servers. Stripe is PCI DSS Level 1 certified — the highest level of payment security certification available.',
            },
            {
                q: 'What happens if I approve the device and then find a problem later?',
                a: 'If you approve the device and later discover a hidden defect that couldn\'t be detected during the 5-day window (for example, intermittent hardware failure), you may be eligible for a return under our 30-day hidden defect policy. Contact support with a clear description and photos of the issue. Buyer\'s remorse — changing your mind after approving — is not eligible.',
            },
            {
                q: 'Can the seller see my payment information?',
                a: 'No. Sellers only see that payment has been confirmed by escrow. No card details, bank details, or personal payment information is visible to sellers at any point.',
            },
        ],
    },

    // ── 4. Verification & IMEI ────────────────────────────────────
    {
        id: 'verification',
        label: 'Verification & IMEI',
        icon: ShieldCheckIcon,
        color: 'bg-blue-50',
        iconColor: 'text-blue-600',
        items: [
            {
                q: 'What is an IMEI and why does it matter?',
                a: 'The IMEI (International Mobile Equipment Identity) is a unique 15-digit number assigned to every mobile device. It is registered with global databases that track stolen and blacklisted phones. A device with a flagged IMEI may be blocked by carriers, rendering it unable to make calls or use mobile data — even if it functions otherwise. Go2Hand runs an IMEI check on every smartphone listing before it goes live.',
            },
            {
                q: 'How do I find my device\'s IMEI?',
                a: 'There are four ways: (1) Dial *#06# on the phone — the IMEI appears on screen. (2) Settings → General → About (iPhone). (3) Settings → About Phone → Status (Android). (4) Look on the SIM card tray, the device box, or the back cover (older models).',
            },
            {
                q: 'What does "IMEI Clean" mean on a listing?',
                a: '"IMEI Clean" means the device\'s IMEI has been checked against stolen-device and blacklist databases and returned no flags. This is verified by Go2Hand\'s system before the listing goes live. A clean IMEI means the device has not been reported stolen, lost, or blocked by a carrier.',
            },
            {
                q: 'Can a seller fake an IMEI check?',
                a: 'No. The IMEI check is run through Go2Hand\'s verification system — sellers enter the IMEI and the result is retrieved directly from the database. The check result is locked to the listing and cannot be edited. If a seller tries to list a different device than the one they verified, that is fraud and subject to immediate account removal.',
            },
            {
                q: 'What if I receive a device and the IMEI doesn\'t match?',
                a: 'Dial *#06# immediately after unboxing and compare the IMEI on screen with the IMEI in the listing. If they don\'t match, do not approve the device. Open a dispute, select "IMEI mismatch" as the reason, and include a photo of the on-screen IMEI. This is a clear-cut case and is typically resolved in the buyer\'s favour within 24 hours.',
            },
            {
                q: 'Do laptops and tablets get verified too?',
                a: 'Laptops and desktops don\'t have IMEI numbers — they use serial numbers instead. Go2Hand requires sellers of laptops, tablets, and desktops to run a serial number verification check, which confirms the device has not been flagged in manufacturer databases.',
            },
        ],
    },

    // ── 5. Shipping ───────────────────────────────────────────────
    {
        id: 'shipping',
        label: 'Shipping',
        icon: TruckIcon,
        color: 'bg-purple-50',
        iconColor: 'text-purple-600',
        items: [
            {
                q: 'Who pays for shipping?',
                a: 'Shipping is free for buyers on all Go2Hand listings. Sellers arrange and pay for shipping as part of the sale. The 5% platform fee helps cover this cost. There are no hidden delivery fees added at checkout.',
            },
            {
                q: 'Which carriers does Go2Hand support?',
                a: 'Sellers can ship via J&T Express, ViettelPost, GHTK (Giao Hàng Tiết Kiệm), GHN (Giao Hàng Nhanh), Ninja Van, or any carrier that provides a real-time tracking number. The tracking number is required to mark an order as shipped.',
            },
            {
                q: 'How long does delivery take?',
                a: 'Typically 2–4 business days within Vietnam. North–South routes (Hanoi ↔ HCMC) can take 3–5 days. Remote provinces may take longer. You can track your shipment directly in the Go2Hand order dashboard.',
            },
            {
                q: 'What if my package is lost or damaged in transit?',
                a: 'If the tracking shows no movement for 7 consecutive days after shipping, you can open a dispute. In cases of transit damage, photograph the packaging and the device immediately upon receipt before opening a dispute. Sellers are responsible for packaging devices securely and for using reputable carriers.',
            },
            {
                q: 'Can I arrange to pick up the device in person instead of shipping?',
                a: 'In-person pickup is not currently supported within the Go2Hand platform. All transactions must go through escrow checkout to maintain buyer and seller protection. Arranging direct payment or pickup outside the platform voids all protections.',
            },
            {
                q: 'The seller provided a tracking number but the package hasn\'t moved for days. What do I do?',
                a: 'Contact the seller first via the in-app messaging. If there is no update after 48 hours, open a support ticket and our team will follow up with the carrier on your behalf. If the package is confirmed lost, you receive a full refund.',
            },
        ],
    },

    // ── 6. Disputes & Returns ─────────────────────────────────────
    {
        id: 'disputes',
        label: 'Disputes & Returns',
        icon: ExclamationTriangleIcon,
        color: 'bg-red-50',
        iconColor: 'text-red-500',
        items: [
            {
                q: 'How do I open a dispute?',
                a: 'Go to your order detail page (Dashboard → My Orders → select the order) and tap "Raise a Dispute." Describe the issue clearly, select the relevant category (wrong condition, IMEI mismatch, missing accessories, etc.), and attach photos. Disputes must be opened before your 5-day inspection window closes.',
            },
            {
                q: 'How long does a dispute take to resolve?',
                a: 'Our trust & safety team reviews all disputes within 24 hours of submission. We may ask for additional evidence from either party. A final decision is typically issued within 24–48 hours. All decisions are binding and applied immediately.',
            },
            {
                q: 'What happens if a dispute is resolved in my favour as a buyer?',
                a: 'The Stripe PaymentIntent is cancelled. Since your payment was authorised but not yet captured, no money was ever charged. The authorisation on your card is simply released — most banks show this within 1–3 business days, though the hold typically vanishes immediately on modern digital cards.',
            },
            {
                q: 'What happens if a dispute goes against me as a seller?',
                a: 'The buyer\'s payment is cancelled and they keep the device or return it (depending on the dispute type). Your seller metrics are updated to reflect the dispute. Repeated disputes that are resolved against you may result in listing restrictions or account review.',
            },
            {
                q: 'What qualifies for a return under the 30-day policy?',
                a: 'The 30-day return policy covers hidden defects that could not reasonably be detected during the 5-day inspection window — for example, an intermittent speaker fault, a battery that degrades abnormally fast within the first few weeks, or cellular connectivity issues in areas with normal signal. It does not cover: change of mind, physical damage caused after delivery, or issues that were clearly visible at the time of delivery.',
            },
            {
                q: 'Can I dispute a transaction after the 5-day window has passed?',
                a: 'Standard disputes must be filed within the 5-day inspection window. After that window closes and payment releases, only the 30-day hidden defect return policy applies. We strongly encourage buyers to inspect devices thoroughly within the first 24–48 hours of delivery.',
            },
        ],
    },

    // ── 7. Account & Profile ──────────────────────────────────────
    {
        id: 'account',
        label: 'Account & Profile',
        icon: UserCircleIcon,
        color: 'bg-gray-100',
        iconColor: 'text-gray-500',
        items: [
            {
                q: 'How do I create an account?',
                a: 'Go to /signup and choose your preferred sign-up method: Google, Facebook, or email and password. You\'ll need a username (3–20 alphanumeric characters), a valid email address, and a password of at least 8 characters. Email accounts require a one-click verification link before you can buy or sell.',
            },
            {
                q: 'Can I use the same account to both buy and sell?',
                a: 'Yes. Every Go2Hand account has both buyer and seller capabilities from day one. Your buyer dashboard tracks orders and your watchlist. Your seller dashboard tracks listings and sales. Switch between them from the top navigation.',
            },
            {
                q: 'How do I become a Verified Seller?',
                a: 'Verified Seller status is awarded by the Go2Hand team after a review of your listing history, identity confirmation, and seller metrics. Verified Sellers get a blue shield badge on their profile, increased listing visibility, and higher buyer trust. Apply at /get-verified.',
            },
            {
                q: 'How is my seller rating calculated?',
                a: 'Your seller rating is the average of your overall ratings from verified buyer reviews. Reviews are only unlocked after a completed order — buyers cannot leave a review without having gone through the full purchase and inspection flow. Ratings cover three dimensions: overall experience, seller communication, and device accuracy.',
            },
            {
                q: 'Can I delete my account?',
                a: 'Yes. Go to Settings → Account → Delete Account. Accounts with active listings or open orders cannot be deleted until those are resolved. After deletion, your public profile and listings are permanently removed. Transaction records are retained for legal compliance.',
            },
            {
                q: 'I forgot my password. How do I reset it?',
                a: 'Go to /login → "Forgot password?" and enter your email address. You\'ll receive a password reset link within a few minutes. Check your spam folder if you don\'t see it. The link expires after 1 hour.',
            },
            {
                q: 'Can I change my username?',
                a: 'Username changes are not currently self-service. If you need to change yours for a legitimate reason (e.g. it contains personal information you\'d like removed), contact our support team at /contact with your request.',
            },
        ],
    },
]

// ─────────────────────────────────────────────────────────────────
// ACCORDION ITEM
// ─────────────────────────────────────────────────────────────────
function AccordionItem({ item, isOpen, onToggle }: {
    item: FaqItem
    isOpen: boolean
    onToggle: () => void
}) {
    const contentRef = useRef<HTMLDivElement>(null)

    return (
        <div className={`border-b border-gray-100 last:border-b-0 transition-colors ${isOpen ? 'bg-teal-50/40' : 'hover:bg-gray-50/60'}`}>
            {/* Question button */}
            <button
                onClick={onToggle}
                className="w-full flex items-start justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left group"
                aria-expanded={isOpen}
            >
                <span className={`text-sm sm:text-base font-semibold leading-snug transition-colors ${isOpen ? 'text-teal-800' : 'text-gray-900 group-hover:text-teal-700'}`}>
                    {item.q}
                </span>
                <ChevronDownIcon
                    className={`w-5 h-5 shrink-0 mt-0.5 transition-all duration-300 ${
                        isOpen ? 'rotate-180 text-teal-600' : 'text-gray-400 group-hover:text-teal-500'
                    }`}
                />
            </button>

            {/* Answer — CSS-animated height via max-height */}
            <div
                ref={contentRef}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <div className="text-sm text-gray-600 leading-relaxed border-l-2 border-teal-200 pl-4">
                        {typeof item.a === 'string' ? item.a : item.a}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// CATEGORY SECTION — heading + accordion list
// ─────────────────────────────────────────────────────────────────
function CategorySection({ category }: { category: FaqCategory }) {
    // Track which question is open within this section
    // Only one question can be open at a time per section
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const Icon = category.icon

    const toggle = (i: number) => setOpenIndex(prev => prev === i ? null : i)

    return (
        <section id={category.id} className="scroll-mt-24">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className={`w-9 h-9 ${category.color} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${category.iconColor}`} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{category.label}</h2>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {category.items.length} questions
                </span>
            </div>

            {/* Accordion card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {category.items.map((item, i) => (
                    <AccordionItem
                        key={i}
                        item={item}
                        isOpen={openIndex === i}
                        onToggle={() => toggle(i)}
                    />
                ))}
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────
export default function FaqPage() {
    const [activeCategory, setActiveCategory] = useState<string>(FAQ_CATEGORIES[0].id)

    const scrollToSection = (id: string) => {
        setActiveCategory(id)
        const el = document.getElementById(id)
        if (el) {
            const offset = 88 // navbar height + a little breathing room
            const top = el.getBoundingClientRect().top + window.scrollY - offset
            window.scrollTo({ top, behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            {/* ── HERO ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-12 sm:pt-16 pb-14 sm:pb-18 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-200 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                        <ShieldSolid className="w-3.5 h-3.5 text-emerald-400" />
                        Help Centre
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-[1.1] mb-5 tracking-tight">
                        Frequently Asked{' '}
                        <span className="text-teal-300">Questions</span>
                    </h1>

                    <p className="text-teal-100 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
                        Everything you need to know about buying, selling, escrow, and device verification on Go2Hand.
                    </p>

                    {/* Quick stats */}
                    <div className="flex flex-wrap justify-center gap-5 sm:gap-10">
                        {[
                            { value: FAQ_CATEGORIES.reduce((n, c) => n + c.items.length, 0).toString(), label: 'Questions answered' },
                            { value: '7', label: 'Topic categories' },
                            { value: '< 1 min', label: 'Avg. read per answer' },
                        ].map(({ value, label }) => (
                            <div key={label} className="text-center">
                                <div className="text-xl sm:text-2xl font-black text-white">{value}</div>
                                <div className="text-xs text-teal-300 mt-0.5 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MAIN CONTENT ── */}
            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex gap-8 items-start">

                    {/* ── STICKY SIDEBAR NAV — desktop only ── */}
                    <aside className="hidden lg:block sticky top-[80px] w-[220px] shrink-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                            Jump to topic
                        </p>
                        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {FAQ_CATEGORIES.map((cat) => {
                                const Icon = cat.icon
                                const isActive = activeCategory === cat.id
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => scrollToSection(cat.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm
                                            font-semibold transition-colors text-left
                                            border-b border-gray-50 last:border-b-0
                                            ${isActive
                                                ? 'bg-teal-50 text-teal-800'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-teal-700'
                                            }`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? cat.color : 'bg-gray-100'}`}>
                                            <Icon className={`w-3.5 h-3.5 ${isActive ? cat.iconColor : 'text-gray-400'}`} />
                                        </div>
                                        {cat.label}
                                    </button>
                                )
                            })}
                        </nav>

                        {/* Still need help? */}
                        <div className="mt-4 bg-teal-800 rounded-2xl p-4 text-center">
                            <ChatBubbleLeftEllipsisIcon className="w-7 h-7 text-teal-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-white mb-1">Still have questions?</p>
                            <p className="text-[11px] text-teal-300 mb-3 leading-snug">
                                Our team replies within a few hours.
                            </p>
                            <Link
                                href="/contact"
                                className="flex items-center justify-center gap-1 text-[11px] font-bold
                                    text-teal-800 bg-white hover:bg-teal-50 px-3 py-2 rounded-xl
                                    transition-colors"
                            >
                                Contact Support <ArrowRightIcon className="w-3 h-3" />
                            </Link>
                        </div>
                    </aside>

                    {/* ── RIGHT: content ── */}
                    <div className="flex-1 min-w-0">

                        {/* Mobile category pills — horizontal scroll */}
                        <div className="lg:hidden mb-6 overflow-x-auto pb-2 scrollbar-none">
                            <div className="flex gap-2 w-max">
                                {FAQ_CATEGORIES.map((cat) => {
                                    const Icon = cat.icon
                                    const isActive = activeCategory === cat.id
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => scrollToSection(cat.id)}
                                            className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap
                                                ${isActive
                                                    ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'
                                                }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-200' : 'text-gray-400'}`} />
                                            {cat.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* FAQ sections */}
                        <div className="flex flex-col gap-10 sm:gap-12">
                            {FAQ_CATEGORIES.map((category) => (
                                <CategorySection key={category.id} category={category} />
                            ))}
                        </div>

                        {/* ── BOTTOM CTA ── */}
                        <div className="mt-10 sm:mt-14 bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-white mb-1">
                                        Didn't find your answer?
                                    </p>
                                    <p className="text-sm text-teal-200 leading-relaxed">
                                        Our trust & safety team is available during business hours and responds to every message within a few hours.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                                <Link
                                    href="/contact"
                                    className="flex items-center justify-center gap-2 bg-white text-teal-800
                                        font-bold text-sm px-5 py-3 rounded-xl hover:bg-teal-50
                                        transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    Contact Support
                                    <ArrowRightIcon className="w-4 h-4" />
                                </Link>
                                <Link
                                    href="/how-it-works"
                                    className="flex items-center justify-center gap-2 bg-white/10 border
                                        border-white/20 text-white font-semibold text-sm px-5 py-3
                                        rounded-xl hover:bg-white/20 transition-all"
                                >
                                    How Escrow Works →
                                </Link>
                            </div>
                        </div>

                        {/* Trust badges row */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { icon: ShieldCheckIcon, title: 'Escrow protected', desc: 'Your payment is held until you approve the device.' },
                                { icon: CheckCircleIcon, title: 'IMEI verified', desc: 'Every smartphone is checked against global stolen-device databases.' },
                                { icon: MagnifyingGlassIcon, title: '5-day inspection', desc: 'Inspect thoroughly before your money moves anywhere.' },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
                                    <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 mb-0.5">{title}</p>
                                        <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}