// src/app/categories/[category]/[brand]/page.tsx
// ============================================
// BRAND-IN-CATEGORY PAGE — /categories/smartphones/apple
//
// Server Component — data fetched server-side, no spinners needed.
//
// SEO additions (Week 10):
//  • Rich title:       "Buy Second-Hand Apple Smartphones — Go2Hand"
//  • Meta description: brand-specific copy with device count + trust signals
//  • Keywords:         brand + category long-tail queries
//  • OpenGraph:        brand logo (when available) or site default OG image
//  • Twitter Card:     summary_large_image
//  • canonical URL:    prevents duplicate content from sort/filter params
//  • JSON-LD Product:  ItemList schema listing top devices for rich results
//  • JSON-LD Breadcrumb: "Go2Hand › Smartphones › Apple" in Google results
// ============================================

import type { Metadata } from 'next'
import Script              from 'next/script'
import { notFound }        from 'next/navigation'
import Link                from 'next/link'
import Image               from 'next/image'
import Navbar              from '@/components/layout/Navbar'
import Footer              from '@/components/layout/Footer'
import Breadcrumb          from '@/components/layout/Breadcrumb'
import LazyDeviceCard      from '@/components/devices/LazyDeviceCard'
import SortSelect          from '@/components/ui/SortSelect'
import {
    getCategoryBySlug,
    getBrandBySlug,
    getModelsInBrandCategory,
} from '@/services/categoryService'
import { getDevices, type ListingFilters } from '@/services/deviceService'
import {
    buildTitle,
    truncateDesc,
    buildBreadcrumbJsonLd,
    SITE_URL,
} from '@/lib/seo'

// ── Sort options ──────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// generateMetadata
//
// Called by Next.js at request time (or build time for static pages).
// All <head> SEO tags for this page are generated here.
// ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { category: categorySlug, brand: brandSlug } = await params
    const { model: modelFilter }                       = await searchParams

    const [category, brand] = await Promise.all([
        getCategoryBySlug(categorySlug),
        getBrandBySlug(brandSlug),
    ])

    // Minimal fallback when brand/category not found (page will 404 anyway)
    if (!category || !brand) {
        return { title: buildTitle(['Brand Not Found']) }
    }

    // ── Canonical URL ─────────────────────────────────────────────
    // Always points to the base brand page — sort/model params are
    // intentionally excluded to prevent duplicate-content issues.
    const canonical = `${SITE_URL}/categories/${categorySlug}/${brandSlug}`

    // ── Build page-specific copy ──────────────────────────────────
    // When a model filter is active (e.g. "iPhone 15") we surface that
    // in the title and description for extra keyword relevance.
    const pageSubject = modelFilter
        ? `${brand.name} ${modelFilter}`
        : `${brand.name} ${category.name}`

    const title = buildTitle([
        `Buy Second-Hand ${pageSubject}`,
        'IMEI Verified & Escrow Protected',
    ])

    const description = truncateDesc(
        modelFilter
            // Model-filtered page: tight, model-specific copy
            ? `Shop verified second-hand ${brand.name} ${modelFilter} on Go2Hand. ` +
              `Every device is IMEI-checked and condition-graded. ` +
              `Escrow-protected payment. Free shipping across Vietnam.`
            // Brand overview page: broader copy that captures brand + category queries
            : `Browse verified second-hand ${brand.name} ${category.name.toLowerCase()} on Go2Hand. ` +
              `${brand.description ? brand.description + ' ' : ''}` +
              `All devices IMEI-verified, escrow-protected, and free shipping Vietnam.`
    )

    const keywords = [
        `buy used ${brand.name} ${category.name.toLowerCase()} Vietnam`,
        `second hand ${brand.name} Vietnam`,
        `refurbished ${brand.name}`,
        `used ${brand.name} ${category.name.toLowerCase()} Ho Chi Minh`,
        `${brand.name} ${category.name.toLowerCase()} escrow`,
        ...(modelFilter
            ? [
                `buy used ${brand.name} ${modelFilter}`,
                `second hand ${brand.name} ${modelFilter} Vietnam`,
                `${brand.name} ${modelFilter} price Vietnam`,
              ]
            : []),
        'Go2Hand', 'IMEI verified', 'escrow payment Vietnam',
    ].join(', ')

    // Use the brand's logo as OG image when available so the share
    // card looks branded. Fall back to the site default OG image.
    const ogImage = brand.logo_url
        ? { url: brand.logo_url, width: 400, height: 400, alt: `${brand.name} logo` }
        : { url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: `${pageSubject} on Go2Hand` }

    return {
        title,
        description,
        keywords,

        robots: {
            index:     true,
            follow:    true,
            // When a model filter is active the URL has query params —
            // we still allow indexing because these are genuinely useful
            // "iPhone 15" filtered pages that deserve their own ranking.
            googleBot: { index: true, follow: true },
        },

        alternates: {
            canonical,
        },

        openGraph: {
            type:        'website',
            url:         canonical,
            siteName:    'Go2Hand',
            title:       `${pageSubject} — Go2Hand`,
            description,
            locale:      'en_VN',
            images:      [ogImage],
        },

        twitter: {
            card:        'summary_large_image',
            title:       `${pageSubject} — Go2Hand`,
            description,
            images:      [ogImage.url],
        },
    }
}

// ─────────────────────────────────────────────────────────────────
// PAGE — Server Component
// ─────────────────────────────────────────────────────────────────
export default async function BrandCategoryPage({ params, searchParams }: Props) {
    const { category: categorySlug, brand: brandSlug } = await params
    const { model: modelFilter, sort: sortParam }      = await searchParams

    const [category, brand, models] = await Promise.all([
        getCategoryBySlug(categorySlug),
        getBrandBySlug(brandSlug),
        getModelsInBrandCategory(brandSlug, categorySlug),
    ])

    if (!category || !brand) notFound()

    const sortBy = (SORT_OPTIONS.find(s => s.value === sortParam)?.value) ?? 'popular'

    const { devices: allDevices, total } = await getDevices({
        category: categorySlug, brand: brandSlug, sortBy, limit: 40,
    })

    // Apply model filter in-memory (small result set after brand+cat filter)
    const devices = modelFilter
        ? allDevices.filter(d => d.model === modelFilter)
        : allDevices

    const baseHref = `/categories/${categorySlug}/${brandSlug}`

    // Helper: build a URL preserving model/sort params, with overrides
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

    // ── JSON-LD structured data ───────────────────────────────────

    // Breadcrumb — shows "Go2Hand › Smartphones › Apple" in Google
    const breadcrumbJsonLd = buildBreadcrumbJsonLd([
        { name: 'Go2Hand',        href: '/'                                    },
        { name: category.name,    href: `/categories/${categorySlug}`           },
        { name: brand.name,       href: `/categories/${categorySlug}/${brandSlug}` },
        ...(modelFilter
            ? [{ name: modelFilter, href: `${baseHref}?model=${encodeURIComponent(modelFilter)}` }]
            : []),
    ])

    // ItemList — surfaces individual listings as rich results when Google
    // crawls the brand page. We include up to 10 items (Google's limit
    // for ItemList rich results is generous, but 10 covers the visible fold).
    const itemListJsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type':    'ItemList',
        name:       `Second-hand ${brand.name} ${category.name} on Go2Hand`,
        url:        `${SITE_URL}${baseHref}`,
        numberOfItems: devices.length,
        itemListElement: devices.slice(0, 10).map((device, i) => ({
            '@type':    'ListItem',
            position:   i + 1,
            url:        `${SITE_URL}/devices/${device.id}`,
            name:       device.fullName,
            image:      device.images?.[0] ?? undefined,
            // Inline Offer so Google can show pricing in search
            offers: {
                '@type':        'Offer',
                priceCurrency:  'USD',
                price:          device.price.toFixed(2),
                availability:   'https://schema.org/InStock',
                itemCondition:  'https://schema.org/UsedCondition',
            },
        })),
    })

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── JSON-LD structured data injected into <head> ── */}
            <Script
                id="jsonld-breadcrumb"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
                strategy="beforeInteractive"
            />
            <Script
                id="jsonld-itemlist"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: itemListJsonLd }}
                strategy="beforeInteractive"
            />

            <Navbar />

            {/* ==================== HERO ==================== */}
            <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 pt-8 sm:pt-9 pb-12 sm:pb-14 px-4 sm:px-6">
                <div className="max-w-[1160px] mx-auto">
                    <Breadcrumb
                        items={[
                            { label: category.name, href: `/categories/${categorySlug}` },
                            { label: brand.name },
                        ]}
                        dark
                    />

                    <div className="mt-5 sm:mt-6 flex items-start sm:items-center gap-4 sm:gap-5">
                        {/* Brand logo or initial bubble */}
                        <div className="w-[60px] sm:w-[72px] h-[60px] sm:h-[72px] rounded-2xl shrink-0 border border-white/10 flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-sm">
                            {brand.logo_url ? (
                                <Image
                                    src={brand.logo_url}
                                    alt={`${brand.name} logo`}
                                    width={56}
                                    height={56}
                                    sizes="56px"
                                    className="w-12 sm:w-14 h-12 sm:h-14 object-contain p-1"
                                />
                            ) : (
                                <span className="text-2xl sm:text-3xl font-black text-white">
                                    {brand.name[0]}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* H1 — primary ranking signal for the page.
                                Format: "Apple Smartphones" (or "Apple iPhone 15" when filtered) */}
                            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                {brand.name}{' '}
                                <span className="text-teal-300">
                                    {modelFilter ?? category.name}
                                </span>
                            </h1>
                            {brand.description && (
                                <p className="text-teal-200 text-sm mt-1.5 max-w-md leading-relaxed hidden sm:block">
                                    {brand.description}
                                </p>
                            )}
                        </div>

                        <div className="shrink-0 text-right ml-auto">
                            <div className="text-2xl sm:text-3xl font-black text-white">{total}</div>
                            <div className="text-teal-300 text-xs font-semibold mt-0.5">Verified devices</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

                {/* ==================== CONTROLS ROW ==================== */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">

                    {/* Model filter pills — horizontal scroll on mobile */}
                    {models.length > 0 && (
                        <div className="flex items-center gap-2 flex-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-1 shrink-0">
                                Model
                            </span>

                            {/* "All" pill */}
                            <Link
                                href={buildHref({ model: undefined })}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold border transition-all duration-150 whitespace-nowrap shrink-0
                                    ${!modelFilter
                                        ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'
                                    }`}
                            >
                                All
                                <span className={`ml-1.5 font-normal ${!modelFilter ? 'text-teal-200' : 'text-gray-400'}`}>
                                    ({total})
                                </span>
                            </Link>

                            {models.map(model => (
                                <Link
                                    key={model.id}
                                    href={buildHref({ model: model.model_name })}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold border transition-all duration-150 whitespace-nowrap shrink-0
                                        ${modelFilter === model.model_name
                                            ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'
                                        }`}
                                >
                                    {model.model_name}
                                    <span className={`ml-1.5 font-normal ${modelFilter === model.model_name ? 'text-teal-200' : 'text-gray-400'}`}>
                                        ({model.count})
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Sort dropdown */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
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
                <p className="text-sm text-gray-500 mb-4 sm:mb-5">
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
                {/* 2-col on mobile → 3-col on md → 4-col on lg */}
                {devices.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {devices.map((device, i) => (
                            <LazyDeviceCard
                                key={device.id}
                                device={device}
                                animationDelay={i * 40}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-2xl">
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
                                className="bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
                            >
                                Show all {brand.name} devices
                            </Link>
                        )}
                    </div>
                )}

                {/* "See all" link to /devices with full filter UI */}
                {devices.length > 0 && (
                    <div className="mt-8 sm:mt-10 text-center">
                        <Link
                            href={`/devices?category=${categorySlug}&brand=${brandSlug}`}
                            className="inline-flex items-center gap-2 border-2 border-teal-800 text-teal-800 font-semibold px-5 sm:px-6 py-3 rounded-xl hover:bg-teal-800 hover:text-white transition-all duration-200 text-sm"
                        >
                            See all {brand.name} listings with full filters
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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