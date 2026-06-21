// src/app/categories/[category]/[brand]/page.tsx
// ============================================
// BRAND-IN-CATEGORY PAGE — Responsive
// ============================================

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Breadcrumb from '@/components/layout/Breadcrumb'
import LazyDeviceCard from '@/components/devices/LazyDeviceCard'
import SortSelect from '@/components/ui/SortSelect'
import {
    getCategoryBySlug, getBrandBySlug, getModelsInBrandCategory,
} from '@/services/categoryService'
import { getDevices, type ListingFilters } from '@/services/deviceService'

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

    const devices = modelFilter
        ? allDevices.filter(d => d.model === modelFilter)
        : allDevices

    const baseHref = `/categories/${categorySlug}/${brandSlug}`

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
                                <Image src={brand.logo_url} alt={brand.name}
                                    width={56} height={56} sizes="56px" className="w-12 sm:w-14 h-12 sm:h-14 object-contain p-1" />
                            ) : (
                                <span className="text-2xl sm:text-3xl font-black text-white">{brand.name[0]}</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                {brand.name}{' '}
                                <span className="text-teal-300">{category.name}</span>
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
                            <Link href={buildHref({ model: undefined })}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold border transition-all duration-150 whitespace-nowrap shrink-0
                                    ${!modelFilter
                                        ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'}`}>
                                All
                                <span className={`ml-1.5 font-normal ${!modelFilter ? 'text-teal-200' : 'text-gray-400'}`}>
                                    ({total})
                                </span>
                            </Link>

                            {models.map(model => (
                                <Link key={model.id} href={buildHref({ model: model.model_name })}
                                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold border transition-all duration-150 whitespace-nowrap shrink-0
                                        ${modelFilter === model.model_name
                                            ? 'bg-teal-800 border-teal-800 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700'}`}>
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
                            Showing <span className="font-semibold text-gray-800">{devices.length}</span>
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
                            <LazyDeviceCard key={device.id} device={device} animationDelay={i * 40} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-2xl">🔍</div>
                        <p className="text-lg font-semibold text-gray-700 mb-1">
                            No {brand.name} {modelFilter ?? category.name} found
                        </p>
                        <p className="text-sm text-gray-400 mb-5">
                            Try clearing the model filter or check back soon.
                        </p>
                        {modelFilter && (
                            <Link href={baseHref}
                                className="bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors">
                                Show all {brand.name} devices
                            </Link>
                        )}
                    </div>
                )}

                {/* See all link */}
                {devices.length > 0 && (
                    <div className="mt-8 sm:mt-10 text-center">
                        <Link href={`/devices?category=${categorySlug}&brand=${brandSlug}`}
                            className="inline-flex items-center gap-2 border-2 border-teal-800 text-teal-800 font-semibold px-5 sm:px-6 py-3 rounded-xl hover:bg-teal-800 hover:text-white transition-all duration-200 text-sm">
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

export async function generateMetadata({ params }: Props) {
    const { category: categorySlug, brand: brandSlug } = await params
    const [category, brand] = await Promise.all([
        getCategoryBySlug(categorySlug), getBrandBySlug(brandSlug),
    ])
    if (!category || !brand) return {}
    return {
        title: `${brand.name} ${category.name} — Go2Hand`,
        description: `Buy verified second-hand ${brand.name} ${category.name.toLowerCase()} on Go2Hand. IMEI checked, escrow protected, 30-day returns.`,
    }
}