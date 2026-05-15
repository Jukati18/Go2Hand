'use client';
// src/app/devices/page.tsx

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DeviceCard from '@/components/devices/DeviceCard'
import FilterSidebar, { type SidebarFilters } from '@/components/devices/FilterSidebar'
import { useFilterOptions } from '@/hooks/useFilterOptions'
import { getDevices, type ListingFilters } from '@/services/deviceService'
import type { Device } from '@/types/device'

// ── Sort options ──────────────────────────────────────────────────
const SORTS: { label: string; value: NonNullable<ListingFilters['sortBy']> }[] = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low → High', value: 'price_asc' },
    { label: 'Price: High → Low', value: 'price_desc' },
    { label: 'Most Popular', value: 'popular' },
]

// ── Friendly label for active filter chips ────────────────────────
const CONDITION_LABELS: Record<string, string> = {
    like_new: 'Like New',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
}

// ─────────────────────────────────────────────────────────────────
// DevicesContent — real component inside <Suspense> so Next.js can
// prerender the outer shell while this reads useSearchParams().
// ─────────────────────────────────────────────────────────────────
function DevicesContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // ── Filter options (brands from Supabase) ─────────────────────
    const { brands, loading: brandsLoading } = useFilterOptions()

    // ── All filter state initialised from URL params ──────────────
    // This makes every filtered URL shareable / bookmarkable.
    const [filters, setFilters] = useState<SidebarFilters>({
        condition: searchParams.get('condition') ?? '',
        brand:     searchParams.get('brand')     ?? '',
        storage:   searchParams.get('storage')   ?? '',
        ram:       searchParams.get('ram')        ?? '',
        minPrice:  searchParams.get('minPrice')   ?? '',
        maxPrice:  searchParams.get('maxPrice')   ?? '',
    })
    const [sortBy, setSortBy] = useState<ListingFilters['sortBy']>(
        (searchParams.get('sortBy') as ListingFilters['sortBy']) ?? 'newest'
    )
    const [search, setSearch] = useState(searchParams.get('q') ?? '')
    const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
    const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))

    // ── Device results ────────────────────────────────────────────
    const [devices, setDevices] = useState<Device[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)

    // ── Sync state → URL (for shareable links) ────────────────────
    // Runs whenever any filter changes, updates the browser URL without
    // a full navigation (scroll: false keeps position).
    const syncURL = useCallback(
        (
            newFilters: SidebarFilters,
            newSortBy: ListingFilters['sortBy'],
            newSearch: string,
            newPage: number
        ) => {
            const params = new URLSearchParams()
            if (newSearch)            params.set('q',         newSearch)
            if (newFilters.condition) params.set('condition', newFilters.condition)
            if (newFilters.brand)     params.set('brand',     newFilters.brand)
            if (newFilters.storage)   params.set('storage',   newFilters.storage)
            if (newFilters.ram)       params.set('ram',        newFilters.ram)
            if (newFilters.minPrice)  params.set('minPrice',   newFilters.minPrice)
            if (newFilters.maxPrice)  params.set('maxPrice',   newFilters.maxPrice)
            if (newSortBy !== 'newest') params.set('sortBy',  newSortBy!)
            if (newPage > 1)          params.set('page',      String(newPage))

            router.replace(
                `${pathname}${params.toString() ? `?${params.toString()}` : ''}`,
                { scroll: false }
            )
        },
        [pathname, router]
    )

    // ── Fetch devices whenever filters, sort, search, or page change ──
    useEffect(() => {
        const fetchDevices = async () => {
            setLoading(true)
            const result = await getDevices({
                search:    search || undefined,
                condition: filters.condition || undefined,
                brand:     filters.brand     || undefined,
                storage:   filters.storage   || undefined,
                ram:       filters.ram        || undefined,
                minPrice:  filters.minPrice  ? Number(filters.minPrice)  : undefined,
                maxPrice:  filters.maxPrice  ? Number(filters.maxPrice)  : undefined,
                sortBy,
                page,
                limit: 20,
            })
            setDevices(result.devices)
            setTotal(result.total)
            setLoading(false)
        }
        fetchDevices()
    }, [filters, sortBy, search, page])

    // ── Handler: update one sidebar filter key ────────────────────
    const handleFilterChange = useCallback(
        (key: keyof SidebarFilters, value: string) => {
            const next = { ...filters, [key]: value }
            setFilters(next)
            setPage(1)
            syncURL(next, sortBy, search, 1)
        },
        [filters, sortBy, search, syncURL]
    )

    // ── Handler: clear every filter ───────────────────────────────
    const handleClearAll = useCallback(() => {
        const empty: SidebarFilters = {
            condition: '', brand: '', storage: '',
            ram: '', minPrice: '', maxPrice: '',
        }
        setFilters(empty)
        setSearch('')
        setSearchInput('')
        setPage(1)
        setSortBy('newest')
        syncURL(empty, 'newest', '', 1)
    }, [syncURL])

    // ── Handler: sort change ──────────────────────────────────────
    const handleSortChange = useCallback(
        (value: ListingFilters['sortBy']) => {
            setSortBy(value)
            setPage(1)
            syncURL(filters, value, search, 1)
        },
        [filters, search, syncURL]
    )

    // ── Handler: search submit (Enter key or button click) ────────
    const handleSearchSubmit = useCallback(() => {
        const trimmed = searchInput.trim()
        setSearch(trimmed)
        setPage(1)
        syncURL(filters, sortBy, trimmed, 1)
    }, [searchInput, filters, sortBy, syncURL])

    // ── Derived values ────────────────────────────────────────────
    const totalPages = Math.ceil(total / 20)
    const activeFilterCount = Object.values(filters).filter(Boolean).length
    const category = searchParams.get('category') // from URL (category page links)

    // ── Page title based on context ───────────────────────────────
    const pageTitle = category
        ? category.charAt(0).toUpperCase() + category.slice(1)
        : 'All Devices'

    return (
        <div className="max-w-[1160px] mx-auto px-6 py-10">

            {/* ── Page header ── */}
            <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">
                    {pageTitle}
                    {search && (
                        <span className="font-normal text-gray-400">
                            {' '}— &quot;{search}&quot;
                        </span>
                    )}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    {loading ? 'Searching…' : `${total.toLocaleString()} devices found`}
                </p>
            </div>

            {/* ── Search bar (within the page, for quick re-search) ── */}
            <div className="mb-6 flex gap-3">
                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200
                    rounded-xl px-4 py-2.5 focus-within:border-teal-500
                    focus-within:ring-2 focus-within:ring-teal-100 transition-all max-w-lg">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        placeholder="Search by model, brand, specs…"
                        className="w-full text-sm text-gray-800 bg-transparent outline-none
                            placeholder:text-gray-400"
                    />
                    {searchInput && (
                        <button
                            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); syncURL(filters, sortBy, '', 1) }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={handleSearchSubmit}
                    className="bg-teal-800 hover:bg-teal-700 text-white font-semibold
                        px-5 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5
                        hover:shadow-md"
                >
                    Search
                </button>
            </div>

            {/* ── Active filter chips ── */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {filters.condition && (
                        <FilterChip
                            label={`Condition: ${CONDITION_LABELS[filters.condition] ?? filters.condition}`}
                            onRemove={() => handleFilterChange('condition', '')}
                        />
                    )}
                    {filters.brand && (
                        <FilterChip
                            label={`Brand: ${filters.brand}`}
                            onRemove={() => handleFilterChange('brand', '')}
                        />
                    )}
                    {filters.storage && (
                        <FilterChip
                            label={`Storage: ${filters.storage}`}
                            onRemove={() => handleFilterChange('storage', '')}
                        />
                    )}
                    {filters.ram && (
                        <FilterChip
                            label={`RAM: ${filters.ram}`}
                            onRemove={() => handleFilterChange('ram', '')}
                        />
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                        <FilterChip
                            label={`Price: $${filters.minPrice || '0'} – $${filters.maxPrice || '∞'}`}
                            onRemove={() => {
                                handleFilterChange('minPrice', '')
                                handleFilterChange('maxPrice', '')
                            }}
                        />
                    )}
                    <button
                        onClick={handleClearAll}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium
                            px-3 py-1.5 rounded-full hover:bg-red-50 transition-all"
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* ── Main layout: sidebar + grid ── */}
            <div className="flex gap-8 items-start">

                {/* FilterSidebar — sticky below navbar */}
                <div className="sticky top-[78px]">
                    <FilterSidebar
                        filters={filters}
                        onChange={handleFilterChange}
                        onClearAll={handleClearAll}
                        brands={brands}
                        brandsLoading={brandsLoading}
                    />
                </div>

                {/* ── Right: sort bar + device grid + pagination ── */}
                <div className="flex-1 min-w-0">

                    {/* Sort bar */}
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-sm text-gray-500">
                            {loading ? '' : (
                                <>
                                    Showing{' '}
                                    <span className="font-semibold text-gray-800">
                                        {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)}
                                    </span>{' '}
                                    of <span className="font-semibold text-gray-800">{total}</span>
                                </>
                            )}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) =>
                                    handleSortChange(e.target.value as ListingFilters['sortBy'])
                                }
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                                    bg-white text-gray-700 focus:border-teal-400 outline-none
                                    cursor-pointer hover:border-gray-300 transition-colors"
                            >
                                {SORTS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Loading skeleton grid */}
                    {loading && (
                        <div className="grid grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    <div className="bg-gray-100 h-44 rounded-t-2xl" />
                                    <div className="p-4 space-y-2">
                                        <div className="bg-gray-100 h-3 rounded w-1/3" />
                                        <div className="bg-gray-100 h-4 rounded w-3/4" />
                                        <div className="bg-gray-100 h-3 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Device grid */}
                    {!loading && devices.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {devices.map((d, i) => (
                                <div
                                    key={d.id}
                                    className="animate-[fadeUp_.35s_ease_both]"
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <DeviceCard device={d} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && devices.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center
                                justify-center mb-4 text-2xl">
                                🔍
                            </div>
                            <p className="text-lg font-semibold text-gray-700 mb-1">
                                No devices found
                            </p>
                            <p className="text-sm text-gray-400 mb-5">
                                Try adjusting your filters or search term
                            </p>
                            <button
                                onClick={handleClearAll}
                                className="bg-teal-800 text-white text-sm font-semibold
                                    px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && !loading && (
                        <div className="flex justify-center items-center gap-2 mt-10">
                            <button
                                disabled={page === 1}
                                onClick={() => {
                                    const p = page - 1
                                    setPage(p)
                                    syncURL(filters, sortBy, search, p)
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm
                                    font-medium text-gray-600 hover:bg-gray-50
                                    disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Prev
                            </button>

                            {/* Page numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    // Show pages around current page
                                    let pageNum: number
                                    if (totalPages <= 5) {
                                        pageNum = i + 1
                                    } else if (page <= 3) {
                                        pageNum = i + 1
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                    } else {
                                        pageNum = page - 2 + i
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => {
                                                setPage(pageNum)
                                                syncURL(filters, sortBy, search, pageNum)
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            }}
                                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                                                ${pageNum === page
                                                    ? 'bg-teal-700 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                disabled={page === totalPages}
                                onClick={() => {
                                    const p = page + 1
                                    setPage(p)
                                    syncURL(filters, sortBy, search, p)
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm
                                    font-medium text-gray-600 hover:bg-gray-50
                                    disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Active filter chip component ──────────────────────────────────
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="flex items-center gap-1.5 bg-teal-50 text-teal-800 border border-teal-200
            text-xs font-semibold px-3 py-1.5 rounded-full">
            {label}
            <button
                onClick={onRemove}
                className="hover:text-red-500 transition-colors ml-0.5"
                aria-label={`Remove filter: ${label}`}
            >
                <XMarkIcon className="w-3.5 h-3.5" />
            </button>
        </span>
    )
}

// ── Skeleton for Suspense fallback ────────────────────────────────
function DevicesSkeleton() {
    return (
        <div className="max-w-[1160px] mx-auto px-6 py-10">
            <div className="mb-6">
                <div className="bg-gray-200 h-7 w-48 rounded animate-pulse" />
                <div className="bg-gray-100 h-4 w-32 rounded mt-2 animate-pulse" />
            </div>
            <div className="flex gap-8">
                <aside className="w-[220px] shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
                </aside>
                <div className="flex-1 grid grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse"
                        >
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
            {/*
                <Suspense> is required because DevicesContent calls
                useSearchParams(), which reads URL at runtime.
                Next.js prerenders only the fallback skeleton.
            */}
            <Suspense fallback={<DevicesSkeleton />}>
                <DevicesContent />
            </Suspense>
            <Footer />
        </div>
    )
}