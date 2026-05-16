// src/app/categories/[category]/page.tsx
// ============================================
// CATEGORY LANDING PAGE — /categories/smartphones
//
// Server Component — no loading state needed;
// Next.js will suspend while data fetches.
//
// Layout:
//   • Teal hero (breadcrumb + category name + count)
//   • Brand grid cards (logo · name · listing count)
//   • "Popular [Category]" device grid (DeviceCard ×8)
// ============================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Breadcrumb from '@/components/layout/Breadcrumb'
import DeviceCard from '@/components/devices/DeviceCard'
import {
    getCategoryBySlug,
    getBrandsInCategory,
    getCategoryDeviceCount,
} from '@/services/categoryService'
import { getDevices } from '@/services/deviceService'

// ── Category icon map — extend as new categories are added ────────
const CATEGORY_META: Record<string, { icon: string; description: string }> = {
    smartphones: {
        icon: '📱',
        description: 'Verified pre-owned smartphones from top brands — IMEI checked, escrow protected.',
    },
    laptops: {
        icon: '💻',
        description: 'Reliable second-hand laptops for work, school, and gaming — all condition-graded.',
    },
    tablets: {
        icon: '⬛',
        description: 'Inspected tablets for study, creativity, and entertainment.',
    },
    watches: {
        icon: '⌚',
        description: 'Pre-owned smartwatches fully tested and ready to pair.',
    },
    audio: {
        icon: '🎧',
        description: 'Earbuds, headphones and speakers at a fraction of retail.',
    },
    desktops: {
        icon: '🖥️',
        description: 'Certified desktop PCs for home and office.',
    },
}

interface Props {
    params: Promise<{ category: string }>
}

export default async function CategoryPage({ params }: Props) {
    const { category: categorySlug } = await params

    // ── Parallel data fetch ────────────────────────────────────────
    const [category, brands, deviceCount, { devices: popularDevices }] = await Promise.all([
        getCategoryBySlug(categorySlug),
        getBrandsInCategory(categorySlug),
        getCategoryDeviceCount(categorySlug),
        getDevices({ category: categorySlug, sortBy: 'popular', limit: 8 }),
    ])

    if (!category) notFound()

    const meta = CATEGORY_META[categorySlug] ?? { icon: '📦', description: '' }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ==================== HERO ==================== */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-9 pb-14 px-6">
                <div className="max-w-[1160px] mx-auto">
                    {/* Breadcrumb: Home > Smartphones */}
                    <Breadcrumb
                        items={[{ label: category.name }]}
                        dark
                    />

                    <div className="mt-6 flex items-center gap-5">
                        {/* Category icon bubble */}
                        <div className="w-[72px] h-[72px] bg-white/10 backdrop-blur-sm rounded-2xl
                            flex items-center justify-center text-4xl shrink-0 border border-white/10">
                            {meta.icon}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">
                                {category.name}
                            </h1>
                            <p className="text-teal-200 text-sm mt-1.5 max-w-md leading-relaxed">
                                {meta.description}
                            </p>
                        </div>

                        {/* Device count badge — pushed right */}
                        <div className="ml-auto shrink-0 text-right">
                            <div className="text-3xl font-black text-white">
                                {deviceCount.toLocaleString()}+
                            </div>
                            <div className="text-teal-300 text-xs font-semibold mt-0.5">
                                Verified devices
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-[1160px] mx-auto px-6">

                {/* ==================== BRAND GRID ==================== */}
                <section className="py-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Browse by Brand
                        </h2>
                        <span className="text-sm text-gray-400">
                            {brands.length} brand{brands.length !== 1 ? 's' : ''} available
                        </span>
                    </div>

                    {brands.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                            <p className="text-lg">No brands available yet.</p>
                            <p className="text-sm mt-1">
                                Add listings in Supabase to populate this page.
                            </p>
                        </div>
                    ) : (
                        // Responsive brand grid: 4 cols on wide, 3 on medium, 2 on narrow
                        <div className="grid grid-cols-4 gap-4">
                            {brands.map((brand) => (
                                <Link
                                    key={brand.id}
                                    href={`/categories/${categorySlug}/${brand.slug}`}
                                    className="group bg-white rounded-2xl border border-gray-100
                                        hover:border-teal-400 hover:shadow-lg
                                        transition-all duration-250 p-6
                                        flex flex-col items-center gap-4 text-center"
                                >
                                    {/* Brand logo or initial fallback */}
                                    <div className="w-16 h-16 flex items-center justify-center">
                                        {brand.logo_url ? (
                                            <Image
                                                src={brand.logo_url}
                                                alt={brand.name}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-contain"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-teal-50
                                                group-hover:bg-teal-100 transition-colors
                                                flex items-center justify-center
                                                text-2xl font-black text-teal-700">
                                                {brand.name[0]}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name + count */}
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm
                                            group-hover:text-teal-800 transition-colors">
                                            {brand.name}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {brand.count} device{brand.count !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {/* Browse arrow — appears on hover */}
                                    <span className="text-[11px] font-semibold text-teal-600
                                        opacity-0 group-hover:opacity-100 -mt-1
                                        transition-opacity duration-150">
                                        Browse →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* ==================== POPULAR DEVICES ==================== */}
                {popularDevices.length > 0 && (
                    <section className="pb-16">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Popular {category.name}
                                </h2>
                                <p className="text-sm text-gray-400 mt-0.5">
                                    Most-viewed right now
                                </p>
                            </div>
                            <Link
                                href={`/devices?category=${categorySlug}`}
                                className="text-sm font-semibold text-teal-700 hover:text-teal-900
                                    flex items-center gap-1 transition-colors"
                            >
                                View all
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </Link>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {popularDevices.map((device, i) => (
                                <div
                                    key={device.id}
                                    className="animate-[fadeUp_.4s_ease_both]"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    <DeviceCard device={device} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <Footer />
        </div>
    )
}

// ── SEO metadata ──────────────────────────────────────────────────
export async function generateMetadata({ params }: Props) {
    const { category: slug } = await params
    const category = await getCategoryBySlug(slug)
    if (!category) return {}
    const meta = CATEGORY_META[slug]
    return {
        title: `${category.name} — Go2Hand`,
        description: meta?.description ??
            `Browse verified second-hand ${category.name.toLowerCase()} on Go2Hand. Escrow protected.`,
    }
}