'use client'

// src/app/dashboard/orders/page.tsx
// ─────────────────────────────────────────────────────────────────
// ORDER HISTORY — /dashboard/orders
//
// Shows the full order history for the logged-in user with:
//   • Summary stat cards: active, inspection-pending, completed
//   • Buyer / Seller tab switch
//   • Status filter pills (All / In Escrow / Shipped / etc.)
//   • Rich OrderHistoryCard rows with:
//       - Inline EscrowTimelineMini progress indicator
//       - Inspection countdown for time-sensitive orders
//       - Tracking number chip when shipped
//       - Role-aware action CTAs (Mark Shipped / Confirm Receipt / etc.)
//   • Empty state with contextual CTA
//   • Loading skeleton rows
//
// Architecture: Client Component so tab/filter switching is instant
// (no round-trip). All data fetching happens via getUserOrders from
// the existing orderService (already built and tested).
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    ShoppingBagIcon,
    TagIcon,
    ShieldCheckIcon,
    ClockIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import OrderHistoryCard from '@/components/orders/OrderHistoryCard'
import { getUserOrders, getInspectionDaysRemaining } from '@/services/orderService'
import { STATUS_LABELS } from '@/components/orders/OrderStatusTracker'
import type { Order, OrderStatus } from '@/types/order'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

// ── Status filter tabs ────────────────────────────────────────────
const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'In Escrow', value: 'paid' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Inspecting', value: 'in_inspection' },
    { label: 'Completed', value: 'completed' },
    { label: 'Disputed', value: 'disputed' },
    { label: 'Cancelled', value: 'cancelled' },
]

// ═════════════════════════════════════════════════════════════════
export default function OrderHistoryPage() {
    const [tab, setTab] = useState<'buyer' | 'seller'>('buyer')
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    // ── Get current user once ─────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
            setUserId(res.data.user?.id ?? null)
        })
    }, [])

    // ── Fetch orders on tab / filter change ───────────────────────
    useEffect(() => {
        if (!userId) return
            ; (async () => {
                setLoading(true)
                const result = await getUserOrders(
                    userId,
                    tab,
                    statusFilter === 'all' ? undefined : statusFilter
                )
                setOrders(result)
                setLoading(false)
            })()
    }, [userId, tab, statusFilter])

    // ── Tab change resets the status filter ───────────────────────
    const handleTabChange = useCallback((newTab: 'buyer' | 'seller') => {
        setTab(newTab)
        setStatusFilter('all')
    }, [])

    // ── Derived stats (from the unfiltered 'all' orders when filter = all) ──
    // We compute from the current orders array; the "all" tab gives total counts.
    const activeOrders = orders.filter(o => ['paid', 'shipped'].includes(o.status))
    const inspectionOrders = orders.filter(o => o.status === 'in_inspection')
    const completedOrders = orders.filter(o => o.status === 'completed')

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

                {/* ── PAGE HEADER ── */}
                <div className="mb-6 sm:mb-7">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order History</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Track all your orders and escrow status in one place
                    </p>
                </div>

                {/* ── SUMMARY STAT CARDS — only shown when there are orders ──
                    3 cards: Active in Escrow / Needs Inspection / Completed
                    These update as the user switches buyer/seller tabs.     */}
                {!loading && orders.length > 0 && statusFilter === 'all' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-7">

                        {/* Active in escrow */}
                        <div className={`rounded-2xl border shadow-sm p-4 sm:p-5 transition-colors ${activeOrders.length > 0
                            ? 'bg-teal-50 border-teal-200'
                            : 'bg-white border-gray-100'
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeOrders.length > 0 ? 'bg-teal-100' : 'bg-gray-100'
                                    }`}>
                                    <ShieldCheckIcon className={`w-4 h-4 ${activeOrders.length > 0 ? 'text-teal-600' : 'text-gray-400'
                                        }`} />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    In Escrow
                                </p>
                            </div>
                            <p className={`text-2xl font-black leading-none ${activeOrders.length > 0 ? 'text-teal-800' : 'text-gray-900'
                                }`}>
                                {activeOrders.length}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Payment held, awaiting shipment or delivery
                            </p>
                        </div>

                        {/* Needs inspection */}
                        <div className={`rounded-2xl border shadow-sm p-4 sm:p-5 transition-colors ${inspectionOrders.length > 0
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-white border-gray-100'
                            }`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inspectionOrders.length > 0 ? 'bg-amber-100' : 'bg-gray-100'
                                    }`}>
                                    <ClockIcon className={`w-4 h-4 ${inspectionOrders.length > 0 ? 'text-amber-500' : 'text-gray-400'
                                        }`} />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Inspecting
                                </p>
                            </div>
                            <p className={`text-2xl font-black leading-none ${inspectionOrders.length > 0 ? 'text-amber-700' : 'text-gray-900'
                                }`}>
                                {inspectionOrders.length}
                            </p>
                            {inspectionOrders.length > 0 ? (
                                <p className="text-xs font-semibold text-amber-600 mt-1 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                    {tab === 'buyer' ? 'Approve or dispute before window closes' : 'Waiting for buyer approval'}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400 mt-1">5-day buyer inspection window</p>
                            )}
                        </div>

                        {/* Completed */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Completed
                                </p>
                            </div>
                            <p className="text-2xl font-black text-gray-900 leading-none">
                                {completedOrders.length}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {tab === 'buyer' ? 'Approved & payment released' : 'Payments received'}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── BUYER / SELLER TAB SWITCH ── */}
                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1
                    w-fit mb-5 shadow-sm">
                    {([
                        { id: 'buyer' as const, label: 'My Purchases', icon: ShoppingBagIcon },
                        { id: 'seller' as const, label: 'My Sales', icon: TagIcon },
                    ]).map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => handleTabChange(id)}
                            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm
                                font-semibold transition-all duration-200
                                ${tab === id
                                    ? 'bg-teal-800 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── STATUS FILTER PILLS ── */}
                {/* Only render filters that have data (or are currently selected) */}
                <div className="flex items-center gap-2 mb-5 sm:mb-6 flex-wrap">
                    {/* Show "All" always */}
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold border
                            transition-all duration-150
                            ${statusFilter === 'all'
                                ? 'bg-teal-800 text-white border-teal-800'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-700'
                            }`}
                    >
                        All
                        {!loading && (
                            <span className={`ml-1.5 text-[10px] font-bold ${statusFilter === 'all' ? 'text-teal-200' : 'text-gray-400'
                                }`}>
                                ({orders.length})
                            </span>
                        )}
                    </button>

                    {/* Contextual filters — only rendered when there are orders in that status */}
                    {!loading && orders.map(o => o.status)
                        // Unique statuses that exist in current order list
                        .filter((s, i, arr) => arr.indexOf(s) === i)
                        // Map to filter config
                        .map(s => STATUS_FILTERS.find(f => f.value === s))
                        .filter(Boolean)
                        // Exclude 'all' (handled above)
                        .filter(f => f!.value !== 'all')
                        .map(f => {
                            const count = orders.filter(o => o.status === f!.value).length
                            return (
                                <button
                                    key={f!.value}
                                    onClick={() => setStatusFilter(f!.value)}
                                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold border
                                        transition-all duration-150
                                        ${statusFilter === f!.value
                                            ? 'bg-teal-800 text-white border-teal-800'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-700'
                                        }`}
                                >
                                    {f!.label}
                                    <span className={`ml-1.5 text-[10px] font-bold ${statusFilter === f!.value ? 'text-teal-200' : 'text-gray-400'
                                        }`}>
                                        ({count})
                                    </span>
                                </button>
                            )
                        })
                    }
                </div>

                {/* ── INSPECTION ALERT BANNER ─────────────────────────────────
                    Shown only when buyer has orders in inspection and is on the
                    buyer tab with "all" or "in_inspection" filter active.       */}
                {tab === 'buyer' && inspectionOrders.length > 0 && (statusFilter === 'all' || statusFilter === 'in_inspection') && !loading && (
                    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl
                        p-4 flex items-start sm:items-center gap-4 animate-[fadeDown_.3s_ease_both]">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center
                            justify-center shrink-0">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-amber-800">
                                {inspectionOrders.length === 1
                                    ? '1 order needs your attention'
                                    : `${inspectionOrders.length} orders need your attention`
                                }
                            </p>
                            <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                                Review the devices and approve or open a dispute before the inspection window closes.
                                {/* Show the most urgent countdown if any */}
                                {(() => {
                                    const urgent = inspectionOrders
                                        .map(o => getInspectionDaysRemaining(o))
                                        .filter((d): d is number => d !== null && d <= 1)
                                    return urgent.length > 0
                                        ? ' ⚠️ One or more expire today!'
                                        : ''
                                })()}
                            </p>
                        </div>
                        <Link
                            href={`/orders/${inspectionOrders[0].id}`}
                            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400
                                text-white font-bold text-xs px-4 py-2.5 rounded-xl
                                transition-all hover:shadow-md shrink-0 whitespace-nowrap"
                        >
                            Review Now <ArrowRightIcon className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}

                {/* ── LOADING SKELETON ── */}
                {loading && (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                {/* Top bar */}
                                <div className="p-4 sm:p-5 flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                            <div className="h-5 w-20 bg-gray-100 rounded-full" />
                                            <div className="h-5 w-24 bg-gray-100 rounded-full" />
                                        </div>
                                        <div className="h-4 w-40 bg-gray-100 rounded" />
                                        <div className="h-3 w-28 bg-gray-100 rounded" />
                                    </div>
                                    <div className="h-7 w-16 bg-gray-100 rounded shrink-0" />
                                </div>
                                {/* Timeline skeleton */}
                                <div className="px-4 sm:px-5 pb-4">
                                    <div className="h-2 w-32 bg-gray-100 rounded mb-3" />
                                    <div className="flex items-center gap-4">
                                        {[1, 2, 3, 4].map(j => (
                                            <div key={j} className="flex flex-col items-center gap-1">
                                                <div className="w-6 h-6 rounded-full bg-gray-100" />
                                                <div className="h-2 w-10 bg-gray-100 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── ORDER HISTORY CARDS ── */}
                {!loading && orders.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {orders.map((order, i) => (
                            <OrderHistoryCard
                                key={order.id}
                                order={order}
                                role={tab}
                                style={{ animationDelay: `${i * 50}ms` }}
                            />
                        ))}
                    </div>
                )}

                {/* ── EMPTY STATE ── */}
                {!loading && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 rounded-2xl bg-teal-50 animate-pulse opacity-60" />
                            <div className="relative w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center">
                                {tab === 'buyer'
                                    ? <ShoppingBagIcon className="w-10 h-10 text-teal-400" />
                                    : <TagIcon className="w-10 h-10 text-teal-400" />
                                }
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-gray-800 mb-2">
                            {statusFilter === 'all'
                                ? tab === 'buyer' ? 'No purchases yet' : 'No sales yet'
                                : `No ${STATUS_LABELS[statusFilter as OrderStatus]?.toLowerCase()} orders`
                            }
                        </h2>

                        <p className="text-sm text-gray-400 mb-7 max-w-xs leading-relaxed">
                            {statusFilter !== 'all'
                                ? 'Try switching to "All" to see your complete order history.'
                                : tab === 'buyer'
                                    ? 'Browse our verified devices and make your first purchase — every order is escrow protected.'
                                    : 'List a device to start selling. Payments are held in escrow until buyers approve.'
                            }
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {statusFilter !== 'all' ? (
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                                        text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                                        transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    Show all orders
                                </button>
                            ) : (
                                <Link
                                    href={tab === 'buyer' ? '/devices' : '/sell'}
                                    className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                                        text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                                        transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    {tab === 'buyer' ? (
                                        <><ShoppingBagIcon className="w-4 h-4" /> Browse Devices</>
                                    ) : (
                                        <><TagIcon className="w-4 h-4" /> List a Device</>
                                    )}
                                </Link>
                            )}
                        </div>

                        {/* Escrow protection reminder in empty state */}
                        <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
                            <ShieldCheckIcon className="w-4 h-4 text-teal-500" />
                            Every order is protected by Go2Hand escrow
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}