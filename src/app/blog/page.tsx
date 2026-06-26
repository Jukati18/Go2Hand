// src/app/blog/page.tsx
// ─────────────────────────────────────────────────────────────────
// Blog & Knowledge Hub — /blog
// Server Component — static educational and news content for Go2Hand.
// Reuses standard layout components, HeroIcons, and SEO utilities.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'
import {
    CalendarIcon,
    ClockIcon,
    ArrowRightIcon,
    BookOpenIcon,
    TagIcon,
    FireIcon,
    SparklesIcon
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
    title: buildTitle(['Knowledge Hub', 'Smart & Safe Second-Hand Tech Guides']),
    description: truncateDesc(
        'Stay updated with the latest tech marketplace trends, deep-dive smartphone inspection guides, ' +
        'device valuation tips, and tutorials on leveraging escrow to protect your funds.'
    ),
    alternates: { canonical: `${SITE_URL}/blog` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/blog`,
        siteName: 'Go2Hand',
        title: 'Go2Hand Knowledge Hub — Master Safe Tech Buying & Selling',
        description: 'Eliminate second-hand tech risks with expert device testing rubrics and secure escrow protocols.',
    },
}

// ── Data ──────────────────────────────────────────────────────────

const CATEGORIES = [
    'All Articles',
    'Inspection Tips',
    'Escrow & Safety',
    'Seller Guides',
    'Market Trends'
]

const FEATURED_POST = {
    title: 'How to Check IMEI and Hidden iCloud Locks When Buying Used iPhones (2026 Guide)',
    excerpt: 'Buying second-hand iPhones online always carries the risk of blacklisted serial numbers, hidden MDM profiles, or carrier locks. Master our 5-step automated IMEI screening checklist to protect your money.',
    category: 'Inspection Tips',
    date: 'June 26, 2026',
    readTime: '7 min read',
    slug: 'how-to-check-imei-hidden-icloud-used-iphone',
    gradient: 'from-teal-800 to-emerald-700'
}

const RECENT_POSTS = [
    {
        title: 'How Does Ring-Fenced Stripe Escrow Actually Work on Go2Hand?',
        excerpt: 'A deep dive into our payment architecture: Discover how buyer funds are securely locked in a neutral holding account and only released when the item is physically verified.',
        category: 'Escrow & Safety',
        date: 'June 24, 2026',
        readTime: '5 min read',
        slug: 'how-stripe-escrow-works-go2hand'
    },
    {
        title: 'Used Phone Valuation Guide: How to Liquidate Your Device in Under 24 Hours',
        excerpt: 'Stop losing money to lowballers. Learn how to use Go2Hand’s automated pricing matrix and optimize your listing photos to attract high-intent buyers instantly.',
        category: 'Seller Guides',
        date: 'June 20, 2026',
        readTime: '4 min read',
        slug: 'used-phone-valuation-sell-fast-guide'
    },
    {
        title: 'OEM vs. Aftermarket: How to Spot Replaced Screens on Used Smartphones',
        excerpt: 'The display is the single most expensive component on any modern smartphone. Bookmark these quick tests for True Tone, bezel reflection, and water drop behavior to avoid refurbished traps.',
        category: 'Inspection Tips',
        date: 'June 15, 2026',
        readTime: '6 min read',
        slug: 'how-to-spot-replaced-aftermarket-screens'
    },
    {
        title: 'Vietnam Tech Market 2026: Which Flagship Smartphones Hold Their Value Best?',
        excerpt: 'An objective analysis of real transaction data across thousands of Go2Hand deals in HCMC and Hanoi, breaking down the resale liquidity of flagship devices.',
        category: 'Market Trends',
        date: 'June 10, 2026',
        readTime: '5 min read',
        slug: 'flagship-smartphones-resale-value-trends'
    },
    {
        title: 'Emergency Protocol: What to Do If Your Package Has the Wrong Weight or Serial Number',
        excerpt: 'Our step-by-step guide to triggering an instant dispute freeze, preserving your ring-fenced escrow balance, and submitting legally valid unboxing evidence.',
        category: 'Escrow & Safety',
        date: 'June 5, 2026',
        readTime: '8 min read',
        slug: 'emergency-dispute-protocol-wrong-item'
    },
    {
        title: 'Demystifying Go2Hand’s Objective A+/A/B/C Cosmetic Grading Standards',
        excerpt: 'We eliminated subjective claims like "99% new". Explore the exact standardized rubrics we use to measure micro-scratches, battery health SLAs, and chassis wear.',
        category: 'Inspection Tips',
        date: 'June 1, 2026',
        readTime: '4 min read',
        slug: 'objective-cosmetic-grading-standards-explained'
    }
]

// ─────────────────────────────────────────────────────────────────
export default function BlogPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ── HERO HEADER ── */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-16 pb-20 px-4 sm:px-6">
                <div className="max-w-[860px] mx-auto text-center">
                    <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-4">
                        Knowledge Hub
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                        Navigate Second-Hand Tech <br />
                        <span className="text-teal-300">With Zero Guesswork.</span>
                    </h1>
                    <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mx-auto">
                        We didn&apos;t just build a safer escrow marketplace—we engineered the ultimate resource hub
                        so you never fall victim to hardware traps or sketchy classified deals.
                    </p>
                </div>
            </section>

            {/* ── CATEGORIES BAR ── */}
            <section className="bg-white border-b border-gray-100 shadow-sm sticky top-[64px] z-20 overflow-x-auto whitespace-nowrap scrollbar-none">
                <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-4 flex gap-2">
                    {CATEGORIES.map((cat, idx) => (
                        <button
                            key={cat}
                            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer
                ${idx === 0
                                    ? 'bg-teal-800 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200/60'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12">

                {/* ── FEATURED POST SECTION ── */}
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <FireIcon className="w-5 h-5 text-amber-500" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Featured Deep Dive</h2>
                    </div>

                    <Link href={`/blog/${FEATURED_POST.slug}`} className="group block">
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm group-hover:shadow-md group-hover:border-teal-200 transition-all duration-200 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">

                            {/* Abstract Banner Block */}
                            <div className={`w-full h-64 sm:h-80 bg-gradient-to-br ${FEATURED_POST.gradient} rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden`}>
                                <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
                                <span className="bg-white/10 border border-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-fit backdrop-blur-sm">
                                    {FEATURED_POST.category}
                                </span>
                                <div>
                                    <SparklesIcon className="w-8 h-8 text-teal-300 mb-4 opacity-70" />
                                    <p className="text-teal-100 text-xs font-semibold">Verified insights crafted by the Go2Hand Trust Team</p>
                                </div>
                            </div>

                            {/* Text content */}
                            <div className="flex flex-col justify-between h-full py-2">
                                <div>
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 font-medium">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            {FEATURED_POST.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            {FEATURED_POST.readTime}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-teal-800 leading-snug mb-4 transition-colors">
                                        {FEATURED_POST.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                        {FEATURED_POST.excerpt}
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-widest">
                                    Read Article <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>

                        </div>
                    </Link>
                </section>

                {/* ── RECENT POSTS GRID ── */}
                <section>
                    <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-4">
                        <BookOpenIcon className="w-5 h-5 text-teal-700" />
                        <h2 className="text-base font-black text-gray-900">Latest Articles</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {RECENT_POSTS.map((post) => (
                            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
                                <article className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
                                    <div>
                                        {/* Category Label */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-100/60 px-2.5 py-1 rounded-md">
                                                <TagIcon className="w-3 h-3" />
                                                {post.category}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-teal-800 mb-2.5 leading-snug transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>

                                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-5">
                                            {post.excerpt}
                                        </p>
                                    </div>

                                    {/* Footer metadata info */}
                                    <div className="border-t border-gray-50 pt-4 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            {post.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            {post.readTime}
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                </section>

            </div>

            {/* ── CTA NEWSLETTER SIGNUP ── */}
            <section className="bg-gradient-to-br from-teal-800 to-teal-700 py-16 px-4 sm:px-6">
                <div className="max-w-[640px] mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                        Subscribe to our safety bulletin
                    </h2>
                    <p className="text-teal-200 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                        Zero spam. Only deep hardware testing guides, platform updates, and critical alerts regarding new marketplace fraud tactics delivered straight to your inbox.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email address..."
                            className="flex-1 px-4 py-3 rounded-xl bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 border-0"
                        />
                        <button className="bg-teal-950 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-teal-900 transition-colors cursor-pointer whitespace-nowrap">
                            Subscribe Now
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}