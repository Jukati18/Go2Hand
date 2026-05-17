'use client'

// ============================================
// /dashboard/orders/page.tsx — Orders Dashboard
//
// Client component: lets the user toggle between
// "Buying" and "Selling" tabs, loads their orders
// from Supabase, and shows them as a list.
// ============================================

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    ShoppingBagIcon,
    TagIcon,
    ChevronRightIcon,
    ClockIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getUserOrders, formatOrderAmount, getInspectionDaysRemaining } from '@/services/orderService'
import { STATUS_LABELS, STATUS_PILL_STYLES } from '@/components/orders/OrderStatusTracker'
import type { Order, OrderStatus } from '@/types/order'
import { supabase } from '@/lib/supabaseClient'

// ── Filter tabs ───────────────────────────────────────────────────
const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'In Escrow', value: 'paid' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Inspecting', value: 'in_inspection' },
    { label: 'Completed', value: 'completed' },
    { label: 'Disputed', value: 'disputed' },
]

export default function OrdersDashboardPage() {
    const [tab, setTab] = useState<'buyer' | 'seller'>('buyer')
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    // ── Get current user ──────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id ?? null)
        })
    }, [])

    // ── Fetch orders whenever tab or filter changes ───────────────
    useEffect(() => {
        if (!userId) return

        const fetchOrders = async () => {
            setLoading(true)
            const result = await getUserOrders(
                userId,
                tab,
                statusFilter === 'all' ? undefined : statusFilter
            )
            setOrders(result)
            setLoading(false)
        }

        fetchOrders()
    }, [userId, tab, statusFilter])

    // ── When tab changes, reset the status filter ─────────────────
    function handleTabChange(newTab: 'buyer' | 'seller') {
        setTab(newTab)
        setStatusFilter('all')
    }

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[1160px] mx-auto px-6 py-10">

                {/* ── Header ── */}
                <div className="mb-7">
                    <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Track your purchases and sales with escrow status
                    </p>
                </div>

                {/* ── Buyer / Seller tab switch ── */}
                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl
                    p-1 w-fit mb-6 shadow-sm">
                    {[
                        { id: 'buyer' as const, label: 'Buying', icon: ShoppingBagIcon },
                        { id: 'seller' as const, label: 'Selling', icon: TagIcon },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => handleTabChange(id)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm
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

                {/* ── Status filter pills ── */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    {STATUS_FILTERS.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setStatusFilter(value)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                                ${statusFilter === value
                                    ? 'bg-teal-800 text-white border-teal-800'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300 hover:text-teal-700'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Loading skeleton ── */}
                {loading && (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse"
                                style={{ animationDelay: `${i * 80}ms` }}
                            />
                        ))}
                    </div>
                )}

                {/* ── Orders list ── */}
                {!loading && orders.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {orders.map((order, i) => (
                            <OrderRow
                                key={order.id}
                                order={order}
                                role={tab}
                                style={{ animationDelay: `${i * 40}ms` }}
                            />
                        ))}
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center
                            justify-center mb-4 text-2xl">
                            {tab === 'buyer' ? '🛍️' : '📦'}
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-1">
                            {statusFilter === 'all'
                                ? `No ${tab === 'buyer' ? 'purchases' : 'sales'} yet`
                                : `No ${STATUS_LABELS[statusFilter as OrderStatus]?.toLowerCase()} orders`
                            }
                        </p>
                        <p className="text-sm text-gray-400 mb-5">
                            {tab === 'buyer'
                                ? 'Browse devices and make your first purchase.'
                                : 'List a device to start selling.'
                            }
                        </p>
                        <Link
                            href={tab === 'buyer' ? '/devices' : '/sell'}
                            className="bg-teal-800 text-white text-sm font-semibold
                                px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
                        >
                            {tab === 'buyer' ? 'Browse Devices' : 'List a Device'}
                        </Link>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}

// ── Single order row card ─────────────────────────────────────────
function OrderRow({
    order,
    role,
    style,
}: {
    order: Order
    role: 'buyer' | 'seller'
    style?: React.CSSProperties
}) {
    const inspectionDays = getInspectionDaysRemaining(order)
    const product = order.product
    const otherParty = role === 'buyer' ? order.seller : order.buyer

    return (
        <Link
            href={`/orders/${order.id}`}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm
                hover:shadow-md hover:border-teal-200 transition-all duration-200
                p-5 flex items-center gap-5 animate-[fadeUp_.35s_ease_both]"
            style={style}
        >
            {/* Device thumbnail */}
            <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100
                flex items-center justify-center shrink-0 overflow-hidden">
                {product?.images?.[0] ? (
                    <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain p-1"
                        unoptimized
                    />
                ) : (
                    <span className="text-2xl">📱</span>
                )}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {/* Status badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_PILL_STYLES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                    </span>

                    {/* Urgent inspection badge */}
                    {inspectionDays !== null && inspectionDays <= 1 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold
                            bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            <ClockIcon className="w-3 h-3" />
                            {inspectionDays === 0 ? 'Expires today' : '1 day left'}
                        </span>
                    )}
                </div>

                <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                    {product?.title ?? 'Device'}
                </p>

                <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">
                        #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    {otherParty && (
                        <span className="text-xs text-gray-400">
                            {role === 'buyer' ? 'from' : 'to'} {otherParty.username}
                        </span>
                    )}
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                        })}
                    </span>
                </div>
            </div>

            {/* Price + arrow */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                    <p className="text-base font-bold text-gray-900">
                        {formatOrderAmount(
                            role === 'buyer'
                                ? order.total
                                : order.amount - order.platformFee
                        )}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {role === 'buyer' ? 'paid' : 'payout'}
                    </p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-teal-500
                    transition-colors" />
            </div>
        </Link>
    )
}