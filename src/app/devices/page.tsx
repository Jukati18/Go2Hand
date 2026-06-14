'use client';
// src/app/devices/page.tsx

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { XMarkIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DeviceCard from '@/components/devices/DeviceCard'
import FilterSidebar, { type SidebarFilters } from '@/components/devices/FilterSidebar'
import ModelFilterStrip from '@/components/devices/ModelFilterStrip'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import { getDevices, type ListingFilters } from '@/services/deviceService'
import type { Device } from '@/types/device'

// ── Sort options ──────────────────────────────────────────────────
const SORTS: { label: string; value: NonNullable<ListingFilters['sortBy']> }[] = [
    { label: 'Newest First',      value: 'newest'     },
    { label: 'Price: Low → High', value: 'price_asc'  },
    { label: 'Price: High → Low', value: 'price_desc' },
    { label: 'Most Popular',      value: 'popular'    },
]

// ── Friendly label for active filter chips ────────────────────────
const CONDITION_LABELS: Record<string, string> = {
    like_new:  'Like New',
    excellent: 'Excellent',
    good:      'Good',
    fair:      'Fair',
}

// ─────────────────────────────────────────────────────────────────
// DevicesContent — real component inside <Suspense>
// ─────────────────────────────────────────────────────────────────
function DevicesContent() {
    const searchParams = useSearchParams()
    const router       = useRouter()
    const pathname     = usePathname()

    const { brands, loading: brandsLoading } = useFilterOptions()

    const [filters, setFilters] = useState<SidebarFilters>({
        condition: searchParams.get('condition') ?? '',
        brand:     searchParams.get('brand')     ?? '',
        storage:   searchParams.get('storage')   ?? '',
        ram:       searchParams.get('ram')       ?? '',
        minPrice:  searchParams.get('minPrice')  ?? '',
        maxPrice:  searchParams.get('maxPrice')  ?? '',
    })
    const [sortBy, setSortBy]         = useState<ListingFilters['sortBy']>(
        (searchParams.get('sortBy') as ListingFilters['sortBy']) ?? 'newest'
    )
    const [search, setSearch]         = useState(searchParams.get('q') ?? '')
    const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
    const [page, setPage]             = useState(Number(searchParams.get('page') ?? 1))

    const [devices, setDevices] = useState<Device[]>([])
    const [total, setTotal]     = useState(0)
    const [loading, setLoading] = useState(true)

    // Mobile filter drawer state
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

    // Lock body scroll when mobile filter drawer is open
    useEffect(() => {
        document.body.style.overflow = mobileFiltersOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [mobileFiltersOpen])

    // Sync state → URL
    const syncURL = useCallback(
        (nf: SidebarFilters, ns: ListingFilters['sortBy'], nq: string, np: number) => {
            const params = new URLSearchParams()
            if (nq)          params.set('q',         nq)
            if (nf.condition)params.set('condition', nf.condition)
            if (nf.brand)    params.set('brand',     nf.brand)
            if (nf.storage)  params.set('storage',   nf.storage)
            if (nf.ram)      params.set('ram',       nf.ram)
            if (nf.minPrice) params.set('minPrice',  nf.minPrice)
            if (nf.maxPrice) params.set('maxPrice',  nf.maxPrice)
            if (ns !== 'newest') params.set('sortBy', ns!)
            if (np > 1)      params.set('page',      String(np))
            router.replace(
                `${pathname}${params.toString() ? `?${params.toString()}` : ''}`,
                { scroll: false }
            )
        },
        [pathname, router]
    )

    // Fetch on change
    useEffect(() => {
        const fetchDevices = async () => {
            setLoading(true)
            const result = await getDevices({
                search:    search    || undefined,
                condition: filters.condition || undefined,
                brand:     filters.brand     || undefined,
                storage:   filters.storage   || undefined,
                ram:       filters.ram       || undefined,
                minPrice:  filters.minPrice  ? Number(filters.minPrice)  : undefined,
                maxPrice:  filters.maxPrice  ? Number(filters.maxPrice)  : undefined,
                sortBy, page, limit: 20,
            })
            setDevices(result.devices)
            setTotal(result.total)
            setLoading(false)
        }
        fetchDevices()
    }, [filters, sortBy, search, page])

    const handleFilterChange = useCallback(
        (key: keyof SidebarFilters, value: string) => {
            const next = { ...filters, [key]: value }
            setFilters(next)
            setPage(1)
            syncURL(next, sortBy, search, 1)
        },
        [filters, sortBy, search, syncURL]
    )

    const handleClearAll = useCallback(() => {
        const empty: SidebarFilters = {
            condition: '', brand: '', storage: '', ram: '', minPrice: '', maxPrice: '',
        }
        setFilters(empty)
        setSearch('')
        setSearchInput('')
        setPage(1)
        setSortBy('newest')
        syncURL(empty, 'newest', '', 1)
        setMobileFiltersOpen(false)
    }, [syncURL])

    const handleSortChange = useCallback(
        (value: ListingFilters['sortBy']) => {
            setSortBy(value); setPage(1); syncURL(filters, value, search, 1)
        },
        [filters, search, syncURL]
    )

    const handleSearchSubmit = useCallback(() => {
        const trimmed = searchInput.trim()
        setSearch(trimmed); setPage(1); syncURL(filters, sortBy, trimmed, 1)
    }, [searchInput, filters, sortBy, syncURL])

    const totalPages        = Math.ceil(total / 20)
    const activeFilterCount = Object.values(filters).filter(Boolean).length
    const category          = searchParams.get('category')
    const pageTitle         = category
        ? category.charAt(0).toUpperCase() + category.slice(1)
        : 'All Devices'

    return (
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

            {/* Page header */}
            <div className="mb-5 sm:mb-7">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {pageTitle}
                    {search && (
                        <span className="font-normal text-gray-400"> — &quot;{search}&quot;</span>
                    )}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    {loading ? 'Searching…' : `${total.toLocaleString()} devices found`}
                </p>
            </div>

            {/* Search bar + mobile filter button */}
            <div className="mb-4 sm:mb-5 flex gap-2 sm:gap-3">
                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200
                    rounded-xl px-3 sm:px-4 py-2.5 focus-within:border-teal-500
                    focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                        placeholder="Search by model, brand, specs…"
                        className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); syncURL(filters, sortBy, '', 1) }}
                            className="text-gray-400 hover:text-gray-600 transition-colors">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={handleSearchSubmit}
                    className="hidden sm:flex bg-teal-800 hover:bg-teal-700 text-white font-semibold
                        px-5 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    Search
                </button>
                {/* Mobile: Filters button */}
                <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 bg-white border border-gray-200
                        hover:border-teal-400 text-gray-600 font-semibold px-3 py-2.5 rounded-xl
                        text-sm transition-colors relative">
                    <FunnelIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-600 text-white
                            text-[10px] font-bold rounded-full flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ── MODEL FILTER STRIP — shows when search matches device models ── */}
            <ModelFilterStrip query={search} />

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-5 sm:mb-6">
                    {filters.condition && (
                        <FilterChip
                            label={`Condition: ${CONDITION_LABELS[filters.condition] ?? filters.condition}`}
                            onRemove={() => handleFilterChange('condition', '')}
                        />
                    )}
                    {filters.brand && (
                        <FilterChip label={`Brand: ${filters.brand}`} onRemove={() => handleFilterChange('brand', '')} />
                    )}
                    {filters.storage && (
                        <FilterChip label={`Storage: ${filters.storage}`} onRemove={() => handleFilterChange('storage', '')} />
                    )}
                    {filters.ram && (
                        <FilterChip label={`RAM: ${filters.ram}`} onRemove={() => handleFilterChange('ram', '')} />
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                        <FilterChip
                            label={`Price: $${filters.minPrice || '0'} – $${filters.maxPrice || '∞'}`}
                            onRemove={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', '') }}
                        />
                    )}
                    <button onClick={handleClearAll}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium
                            px-3 py-1.5 rounded-full hover:bg-red-50 transition-all">
                        Clear all
                    </button>
                </div>
            )}

            {/* ── Main layout: sidebar + grid ── */}
            <div className="flex gap-6 lg:gap-8 items-start">

                {/* ── Desktop sidebar (hidden on mobile) ── */}
                <div className="hidden lg:block sticky top-[78px] shrink-0">
                    <FilterSidebar
                        filters={filters}
                        onChange={handleFilterChange}
                        onClearAll={handleClearAll}
                        brands={brands}
                        brandsLoading={brandsLoading}
                    />
                </div>

                {/* ── Mobile filter drawer overlay ── */}
                {mobileFiltersOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/50"
                            onClick={() => setMobileFiltersOpen(false)} />
                        {/* Drawer */}
                        <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-gray-50
                            overflow-y-auto shadow-2xl">
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-5 py-4
                                bg-white border-b border-gray-100 sticky top-0 z-10">
                                <span className="font-bold text-gray-900">Filters</span>
                                <button onClick={() => setMobileFiltersOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full
                                        text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4">
                                <FilterSidebar
                                    filters={filters}
                                    onChange={(key, value) => {
                                        handleFilterChange(key, value)
                                    }}
                                    onClearAll={handleClearAll}
                                    brands={brands}
                                    brandsLoading={brandsLoading}
                                />
                            </div>
                            {/* Apply button */}
                            <div className="sticky bottom-0 px-4 pb-6 pt-3 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="w-full bg-teal-800 hover:bg-teal-700 text-white font-semibold
                                        py-3 rounded-xl text-sm transition-colors">
                                    Show {total} results
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Right: sort bar + device grid + pagination ── */}
                <div className="flex-1 min-w-0">

                    {/* Sort bar */}
                    <div className="flex items-center justify-between mb-4 sm:mb-5 flex-wrap gap-2">
                        <p className="text-sm text-gray-500">
                            {loading ? '' : (
                                <>
                                    Showing{' '}
                                    <span className="font-semibold text-gray-800">
                                        {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)}
                                    </span>
                                    {' '}of{' '}
                                    <span className="font-semibold text-gray-800">{total}</span>
                                </>
                            )}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 hidden sm:inline">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={e => handleSortChange(e.target.value as ListingFilters['sortBy'])}
                                className="border border-gray-200 rounded-lg px-2 sm:px-3 py-2 text-sm
                                    bg-white text-gray-700 focus:border-teal-400 outline-none
                                    cursor-pointer hover:border-gray-300 transition-colors">
                                {SORTS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Loading skeleton — 1-col → 2-col sm → 3-col lg */}
                    {loading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 sm:h-72 animate-pulse"
                                    style={{ animationDelay: `${i * 60}ms` }}>
                                    <div className="bg-gray-100 h-40 sm:h-44 rounded-t-2xl" />
                                    <div className="p-3 sm:p-4 space-y-2">
                                        <div className="bg-gray-100 h-3 rounded w-1/3" />
                                        <div className="bg-gray-100 h-4 rounded w-3/4" />
                                        <div className="bg-gray-100 h-3 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Device grid — 1-col → 2-col sm → 3-col lg */}
                    {!loading && devices.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {devices.map((d, i) => (
                                <div key={d.id} className="animate-[fadeUp_.35s_ease_both]"
                                    style={{ animationDelay: `${i * 40}ms` }}>
                                    <DeviceCard device={d} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && devices.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-2xl">🔍</div>
                            <p className="text-lg font-semibold text-gray-700 mb-1">No devices found</p>
                            <p className="text-sm text-gray-400 mb-5">Try adjusting your filters or search term</p>
                            <button onClick={handleClearAll}
                                className="bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors">
                                Clear all filters
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && !loading && (
                        <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-8 sm:mt-10 flex-wrap">
                            <button
                                disabled={page === 1}
                                onClick={() => { const p = page - 1; setPage(p); syncURL(filters, sortBy, search, p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                className="px-3 sm:px-4 py-2 rounded-xl border border-gray-200 text-sm
                                    font-medium text-gray-600 hover:bg-gray-50
                                    disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                ← Prev
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum: number
                                    if (totalPages <= 5)          pageNum = i + 1
                                    else if (page <= 3)           pageNum = i + 1
                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                                    else                          pageNum = page - 2 + i
                                    return (
                                        <button key={pageNum}
                                            onClick={() => { setPage(pageNum); syncURL(filters, sortBy, search, pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                            className={`w-8 sm:w-9 h-8 sm:h-9 rounded-lg text-sm font-medium transition-colors
                                                ${pageNum === page ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                disabled={page === totalPages}
                                onClick={() => { const p = page + 1; setPage(p); syncURL(filters, sortBy, search, p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                                className="px-3 sm:px-4 py-2 rounded-xl border border-gray-200 text-sm
                                    font-medium text-gray-600 hover:bg-gray-50
                                    disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Active filter chip ────────────────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="flex items-center gap-1.5 bg-teal-50 text-teal-800 border border-teal-200
            text-xs font-semibold px-3 py-1.5 rounded-full">
            {label}
            <button onClick={onRemove}
                className="hover:text-red-500 transition-colors ml-0.5" aria-label={`Remove filter: ${label}`}>
                <XMarkIcon className="w-3.5 h-3.5" />
            </button>
        </span>
    )
}

// ── Skeleton for Suspense fallback ────────────────────────────────
function DevicesSkeleton() {
    return (
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="mb-6">
                <div className="bg-gray-200 h-7 w-48 rounded animate-pulse" />
                <div className="bg-gray-100 h-4 w-32 rounded mt-2 animate-pulse" />
            </div>
            <div className="flex gap-8">
                <aside className="hidden lg:block w-[220px] shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
                </aside>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse">
                            <div className="bg-gray-100 h-44 rounded-t-2xl" />
                            <div className="p-4 space-y-2">
                                <div className="bg-gray-100 h-3 rounded w-1/3" />
                                <div className="bg-gray-100 h-4 rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Default export: wraps content in Suspense ─────────────────────
export default function DevicesPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Suspense fallback={<DevicesSkeleton />}>
                <DevicesContent />
            </Suspense>
            <Footer />
        </div>
    )
}