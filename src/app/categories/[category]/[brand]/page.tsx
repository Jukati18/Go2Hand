// src/app/categories/[category]/[brand]/page.tsx
// ============================================
// BRAND-IN-CATEGORY PAGE — /categories/smartphones/apple
//
// Server Component — all data fetching happens here.
// The only interactive element (sort dropdown) is
// extracted into <SortSelect> ('use client') so this
// page stays fully SSR / SEO-friendly.
// ============================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Breadcrumb from '@/components/layout/Breadcrumb'
import DeviceCard from '@/components/devices/DeviceCard'
import SortSelect from '@/components/ui/SortSelect'          // ← client component
import {
    getCategoryBySlug,
    getBrandBySlug,
    getModelsInBrandCategory,
} from '@/services/categoryService'
import { getDevices, type ListingFilters } from '@/services/deviceService'

// ── Sort options passed to <SortSelect> ───────────────────────────
const SORT_OPTIONS: { label: string; value: NonNullable<ListingFilters['sortBy']> }[] = [
    { label: 'Most Popular',      value: 'popular'    },
    { label: 'Newest First',      value: 'newest'     },
    { label: 'Price: Low → High', value: 'price_asc'  },
    { label: 'Price: High → Low', value: 'price_desc' },
]

interface Props {
    params:       Promise<{ category: string; brand: string }>
    searchParams: Promise<{ model?: string; sort?: string }>
}

export default async function BrandCategoryPage({ params, searchParams }: Props) {
    const { category: categorySlug, brand: brandSlug } = await params
    const { model: modelFilter, sort: sortParam }      = await searchParams

    // ── Parallel fetch ────────────────────────────────────────────
    const [category, brand, models] = await Promise.all([
        getCategoryBySlug(categorySlug),
        getBrandBySlug(brandSlug),
        getModelsInBrandCategory(brandSlug, categorySlug),
    ])

    if (!category || !brand) notFound()

    // Validate sort param — fall back to 'popular'
    const sortBy =
        (SORT_OPTIONS.find(s => s.value === sortParam)?.value) ?? 'popular'

    // Fetch devices for this brand + category
    const { devices: allDevices, total } = await getDevices({
        category: categorySlug,
        brand:    brandSlug,
        sortBy,
        limit:    40,
    })

    // Apply model filter in JS (exact match against device_model.model_name)
    const devices = modelFilter
        ? allDevices.filter(d => d.model === modelFilter)
        : allDevices

    // Base path used by model-filter links and <SortSelect>
    const baseHref = `/categories/${categorySlug}/${brandSlug}`

    // Helper: build a URL preserving whichever params should survive the click
    function buildHref(overrides: { model?: string | undefined; sort?: string | undefined }) {
        const merged = {
            model: modelFilter,
            sort:  sortParam !== 'popular' ? sortParam : undefined,
            ...overrides,
        }
        const qs = Object.entries(merged)
            .filter((entry): entry is [string, string] => Boolean(entry[1]))
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&')
        return qs ? `${baseHref}?${qs}` : baseHref
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* ==================== HERO ==================== */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700
                pt-9 pb-14 px-6">
                <div className="max-w-[1160px] mx-auto">

                    {/* Breadcrumb: Home › Smartphones › Apple */}
                    <Breadcrumb
                        items={[
                            { label: category.name, href: `/categories/${categorySlug}` },
                            { label: brand.name },
                        ]}
                        dark
                    />

                    <div className="mt-6 flex items-center gap-5">
                        {/* Brand logo or initial bubble */}
                        <div className="w-[72px] h-[72px] rounded-2xl shrink-0 border border-white/10
                            flex items-center justify-center overflow-hidden
                            bg-white/10 backdrop-blur-sm">
                            {brand.logo_url ? (
                                <Image
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    width={56}
                                    height={56}
                                    className="w-14 h-14 object-contain p-1"
                                    unoptimized
                                />
                            ) : (
                                <span className="text-3xl font-black text-white">
                                    {brand.name[0]}
                                </span>
                            )}
                        </div>

                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight">
                                {brand.name}{' '}
                                <span className="text-teal-300">{category.name}</span>
                            </h1>
                            {brand.description && (
                                <p className="text-teal-200 text-sm mt-1.5 max-w-md leading-relaxed">
                                    {brand.description}
                                </p>
                            )}
                        </div>

                        {/* Total count */}
                        <div className="ml-auto shrink-0 text-right">
                            <div className="text-3xl font-black text-white">{total}</div>
                            <div className="text-teal-300 text-xs font-semibold mt-0.5">
                                Verified devices
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-[1160px] mx-auto px-6 py-10">

                {/* ==================== CONTROLS ROW ==================== */}
                <div className="flex items-start justify-between gap-6 mb-8">

                    {/* ── Model filter pills (pure <Link>, no JS needed) ── */}
                    {models.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap flex-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase
                                tracking-widest mr-1 shrink-0">
                                Model
                            </span>

                            {/* "All" pill */}
                            <Link
                                href={buildHref({ model: undefined })}
                                className={`px-4 py-2 rounded-full text-xs font-semibold border
                                    transition-all duration-150
                                    ${!modelFilter
                                        ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'
                                    }`}
                            >
                                All
                                <span className={`ml-1.5 font-normal
                                    ${!modelFilter ? 'text-teal-200' : 'text-gray-400'}`}>
                                    ({total})
                                </span>
                            </Link>

                            {/* One pill per model */}
                            {models.map((model) => (
                                <Link
                                    key={model.id}
                                    href={buildHref({ model: model.model_name })}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold border
                                        transition-all duration-150
                                        ${modelFilter === model.model_name
                                            ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'
                                        }`}
                                >
                                    {model.model_name}
                                    <span className={`ml-1.5 font-normal
                                        ${modelFilter === model.model_name
                                            ? 'text-teal-200'
                                            : 'text-gray-400'}`}>
                                        ({model.count})
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ── Sort dropdown — CLIENT component (fixes the error) ── */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-gray-400">Sort:</span>
                        <SortSelect
                            defaultValue={sortBy}
                            baseHref={baseHref}
                            modelFilter={modelFilter}
                            options={SORT_OPTIONS}
                        />
                    </div>
                </div>

                {/* Results count */}
                <p className="text-sm text-gray-500 mb-5">
                    {modelFilter ? (
                        <>
                            Showing{' '}
                            <span className="font-semibold text-gray-800">{devices.length}</span>
                            {' '}result{devices.length !== 1 ? 's' : ''} for{' '}
                            <span className="font-semibold text-gray-800">{modelFilter}</span>
                        </>
                    ) : (
                        <>
                            <span className="font-semibold text-gray-800">{devices.length}</span>
                            {' '}device{devices.length !== 1 ? 's' : ''} available
                        </>
                    )}
                </p>

                {/* ==================== DEVICE GRID ==================== */}
                {devices.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                        {devices.map((device, i) => (
                            <div
                                key={device.id}
                                className="animate-[fadeUp_.35s_ease_both]"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                <DeviceCard device={device} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center
                            justify-center mb-4 text-2xl">
                            🔍
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-1">
                            No {brand.name} {modelFilter ?? category.name} found
                        </p>
                        <p className="text-sm text-gray-400 mb-5">
                            Try clearing the model filter or check back soon.
                        </p>
                        {modelFilter && (
                            <Link
                                href={baseHref}
                                className="bg-teal-800 text-white text-sm font-semibold
                                    px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
                            >
                                Show all {brand.name} devices
                            </Link>
                        )}
                    </div>
                )}

                {/* "See all in /devices" with full filter UI */}
                {devices.length > 0 && (
                    <div className="mt-10 text-center">
                        <Link
                            href={`/devices?category=${categorySlug}&brand=${brandSlug}`}
                            className="inline-flex items-center gap-2 border-2 border-teal-800
                                text-teal-800 font-semibold px-6 py-3 rounded-xl
                                hover:bg-teal-800 hover:text-white transition-all duration-200 text-sm"
                        >
                            See all {brand.name} listings with full filters
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}

// ── SEO metadata ──────────────────────────────────────────────────
export async function generateMetadata({ params }: Props) {
    const { category: categorySlug, brand: brandSlug } = await params
    const [category, brand] = await Promise.all([
        getCategoryBySlug(categorySlug),
        getBrandBySlug(brandSlug),
    ])
    if (!category || !brand) return {}
    return {
        title: `${brand.name} ${category.name} — Go2Hand`,
        description:
            `Buy verified second-hand ${brand.name} ${category.name.toLowerCase()} on Go2Hand. ` +
            `IMEI checked, escrow protected, 30-day returns.`,
    }
}