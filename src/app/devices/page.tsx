'use client';
// src/app/devices/page.tsx
// Listing / browse page — replaces any local ALL_DEVICES usage

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DeviceCard from '@/components/devices/DeviceCard'
import { getDevices, type ListingFilters } from '@/lib/deviceService'
import type { Device } from '@/types/device'

const CONDITIONS = [
    { label: 'Any Condition', value: '' },
    { label: 'Like New',      value: 'like_new'  },
    { label: 'Excellent',     value: 'excellent' },
    { label: 'Good',          value: 'good'      },
    { label: 'Fair',          value: 'fair'      },
]

const SORTS = [
    { label: 'Newest First', value: 'newest'     },
    { label: 'Price ↑',      value: 'price_asc'  },
    { label: 'Price ↓',      value: 'price_desc' },
    { label: 'Most Popular', value: 'popular'    },
]

export default function DevicesPage() {
    const searchParams  = useSearchParams()

    // ── Filter state ────────────────────────────────────────────────
    const [devices,   setDevices]   = useState<Device[]>([])
    const [total,     setTotal]     = useState(0)
    const [loading,   setLoading]   = useState(true)
    const [condition, setCondition] = useState('')
    const [sortBy,    setSortBy]    = useState<ListingFilters['sortBy']>('newest')
    const [minPrice,  setMinPrice]  = useState('')
    const [maxPrice,  setMaxPrice]  = useState('')
    const [page,      setPage]      = useState(1)

    const category = searchParams.get('category') ?? undefined
    const search   = searchParams.get('q')        ?? undefined

    // ── Fetch on filter change ──────────────────────────────────────
    const fetchDevices = useCallback(async () => {
        setLoading(true)
        const { devices, total } = await getDevices({
            category,
            search,
            condition: condition || undefined,
            minPrice:  minPrice ? Number(minPrice) : undefined,
            maxPrice:  maxPrice ? Number(maxPrice) : undefined,
            sortBy,
            page,
            limit: 20,
        })
        setDevices(devices)
        setTotal(total)
        setLoading(false)
    }, [category, search, condition, minPrice, maxPrice, sortBy, page])

    useEffect(() => { fetchDevices() }, [fetchDevices])

    const totalPages = Math.ceil(total / 20)

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-[1160px] mx-auto px-6 py-10">
                {/* ── Header ── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {category ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : 'All Devices'}
                        {search && <span className="font-normal text-gray-400"> — "{search}"</span>}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">{total} devices available</p>
                </div>

                <div className="flex gap-8">
                    {/* ── Sidebar filters ── */}
                    <aside className="w-56 shrink-0 space-y-6">
                        {/* Condition */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Condition</p>
                            {CONDITIONS.map(c => (
                                <button key={c.value}
                                    onClick={() => { setCondition(c.value); setPage(1) }}
                                    className={`block w-full text-left text-sm py-1.5 px-3 rounded-lg mb-1 transition-colors
                                        ${condition === c.value ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        {/* Price range */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Price Range ($)</p>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Min" value={minPrice}
                                    onChange={e => { setMinPrice(e.target.value); setPage(1) }}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                                <input type="number" placeholder="Max" value={maxPrice}
                                    onChange={e => { setMaxPrice(e.target.value); setPage(1) }}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                            </div>
                        </div>
                    </aside>

                    {/* ── Main grid ── */}
                    <div className="flex-1">
                        {/* Sort bar */}
                        <div className="flex items-center justify-end gap-3 mb-5">
                            <span className="text-sm text-gray-400">Sort by</span>
                            <select value={sortBy} onChange={e => { setSortBy(e.target.value as ListingFilters['sortBy']); setPage(1) }}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>

                        {/* Skeletons */}
                        {loading && (
                            <div className="grid grid-cols-3 gap-4">
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
                        )}

                        {/* Grid — DeviceCard unchanged */}
                        {!loading && devices.length > 0 && (
                            <div className="grid grid-cols-3 gap-4">
                                {devices.map(d => <DeviceCard key={d.id} device={d} />)}
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && devices.length === 0 && (
                            <div className="text-center py-24 text-gray-400">
                                <p className="text-lg font-medium">No devices found</p>
                                <p className="text-sm mt-1">Try adjusting your filters</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-10">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                                    ← Prev
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
                                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}