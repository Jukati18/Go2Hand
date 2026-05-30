// src/app/dashboard/buyer/page.tsx
// ─────────────────────────────────────────────────────────────────
// BUYER DASHBOARD — /dashboard/buyer
//
// Server Component — fetches all data before render (no spinners).
//
// Sections:
//   • Greeting + stat cards (Total Spent / Active Orders / Watchlist / Messages)
//   • Recent Purchases list (last 5 orders as buyer)
//   • Quick actions panel
//   • Watchlist preview (first 4 saved devices)
//   • Buyer protection card
//
// Relationship with existing features:
//   - /watchlist          → full watchlist page (already built)
//   - /dashboard/orders   → full orders list with buyer/seller tabs (already built)
//   - /orders/[id]        → individual order detail + escrow tracker (already built)
//   - /dashboard/messages → messages inbox (new, see messages/page.tsx)
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import Image from 'next/image'
import {
    ShoppingBagIcon,
    HeartIcon,
    ChatBubbleLeftEllipsisIcon,
    CurrencyDollarIcon,
    ClockIcon,
    ChevronRightIcon,
    ArrowRightIcon,
    ShieldCheckIcon,
    TruckIcon,
    CheckCircleIcon,
    TagIcon,
    StarIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { STATUS_LABELS, STATUS_PILL_STYLES } from '@/components/orders/OrderStatusTracker'
import type { OrderStatus } from '@/types/order'

// ── Helpers ───────────────────────────────────────────────────────

function fmtUSD(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(n)
}

function relativeDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CONDITION_LABEL: Record<string, string> = {
    like_new: 'Like New',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
}

const CONDITION_STYLE: Record<string, string> = {
    like_new: 'bg-emerald-50 text-emerald-700',
    excellent: 'bg-emerald-50 text-emerald-700',
    good: 'bg-cyan-50 text-cyan-800',
    fair: 'bg-amber-50 text-amber-700',
}

// ── SSR Supabase client ───────────────────────────────────────────
async function makeSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    )
}

// ══════════════════════════════════════════════════════════════════
export default async function BuyerDashboardPage() {
    const supabase = await makeSupabase()

    // ── Auth guard ─────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?next=/dashboard/buyer')

    // ── Fetch everything in parallel ───────────────────────────────
    const [
        profileRes,
        ordersRes,
        watchlistPreviewRes,
        watchlistCountRes,
        reviewsCountRes,
    ] = await Promise.all([

        // User profile for greeting + avatar
        supabase
            .from('users')
            .select('username, full_name, avatar_url, seller_rating, total_reviews')
            .eq('id', user.id)
            .single(),

        // Last 6 orders where this user is the buyer
        supabase
            .from('orders')
            .select(`
                id, status, amount, total, shipping_fee,
                created_at, tracking_number, inspection_started_at,
                product:products (
                    id, title, images, price,
                    brand:brands ( name )
                )
            `)
            .eq('buyer_id', user.id)
            .order('created_at', { ascending: false })
            .limit(6),

        // First 4 watchlist items for preview panel
        supabase
            .from('watchlist')
            .select(`
                id, created_at,
                product:products (
                    id, title, price, original_price, condition,
                    images, storage_capacity,
                    brand:brands ( name )
                )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(4),

        // Total watchlist count (head-only = fast)
        supabase
            .from('watchlist')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),

        // Reviews the buyer has left (to show "review pending" prompts)
        supabase
            .from('reviews')
            .select('order_id')
            .eq('buyer_id', user.id),
    ])

    // ── Derive stats ───────────────────────────────────────────────
    const profile = profileRes.data
    const orders = ordersRes.data ?? []
    const watchlistItems = watchlistPreviewRes.data ?? []
    const watchlistCount = watchlistCountRes.count ?? 0
    const reviewedOrderIds = new Set((reviewsCountRes.data ?? []).map(r => r.order_id))

    const displayName = profile?.full_name ?? profile?.username ?? 'there'

    // Money: total across all orders the buyer paid (not just completed)
    const totalSpent = orders
        .filter(o => !['pending', 'cancelled'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.total ?? 0), 0)

    // Active = anything that isn't finished
    const activeOrders = orders.filter(
        o => !['completed', 'cancelled', 'refunded'].includes(o.status)
    )

    // Orders where buyer needs to approve or can dispute (in inspection)
    const inspectionOrders = orders.filter(o => o.status === 'in_inspection')

    // Completed orders that haven't been reviewed yet
    const pendingReviews = orders.filter(
        o => o.status === 'completed' && !reviewedOrderIds.has(o.id)
    )

    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

                {/* ── PAGE HEADER ── */}
                <div className="flex items-start justify-between mb-6 sm:mb-8 flex-wrap gap-4">
                    <div>
                        <p className="text-sm text-gray-400 font-medium mb-0.5">Welcome back,</p>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                            {displayName} 🛍️
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Your buyer overview — track orders, watchlist, and more.
                        </p>
                    </div>
                    <Link
                        href="/devices"
                        className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                            text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                            transition-all hover:-translate-y-0.5 hover:shadow-md shrink-0"
                    >
                        <ShoppingBagIcon className="w-4 h-4" />
                        Browse Devices
                    </Link>
                </div>

                {/* ── STAT CARDS — 2-col mobile → 4-col lg ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">

                    {/* Total Spent */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-teal-50 rounded-xl
                            flex items-center justify-center mb-3 sm:mb-4">
                            <CurrencyDollarIcon className="w-5 h-5 text-teal-600" />
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none mb-0.5">
                            {fmtUSD(totalSpent)}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Total Spent
                        </p>
                        <p className="text-xs text-gray-400">
                            {orders.filter(o => o.status === 'completed').length} completed orders
                        </p>
                    </div>

                    {/* Active Orders */}
                    <div className={`rounded-2xl border shadow-sm p-4 sm:p-5 transition-colors ${
                        inspectionOrders.length > 0
                            ? 'bg-amber-50 border-amber-200'
                            : activeOrders.length > 0
                                ? 'bg-white border-gray-100'
                                : 'bg-white border-gray-100'
                    }`}>
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${
                            inspectionOrders.length > 0 ? 'bg-amber-100' : 'bg-gray-100'
                        }`}>
                            <ClockIcon className={`w-5 h-5 ${
                                inspectionOrders.length > 0 ? 'text-amber-500' : 'text-gray-400'
                            }`} />
                        </div>
                        <p className={`text-xl sm:text-2xl font-black leading-none mb-0.5 ${
                            inspectionOrders.length > 0 ? 'text-amber-800' : 'text-gray-900'
                        }`}>
                            {activeOrders.length}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Active Orders
                        </p>
                        {inspectionOrders.length > 0 ? (
                            <p className="text-xs text-amber-600 font-semibold">
                                {inspectionOrders.length} need your approval
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">In escrow / shipping</p>
                        )}
                    </div>

                    {/* Watchlist */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-50 rounded-xl
                            flex items-center justify-center mb-3 sm:mb-4">
                            <HeartSolid className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none mb-0.5">
                            {watchlistCount}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Saved Devices
                        </p>
                        <Link
                            href="/watchlist"
                            className="text-xs text-teal-600 hover:text-teal-800 font-semibold
                                transition-colors"
                        >
                            View all →
                        </Link>
                    </div>

                    {/* Messages */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-xl
                            flex items-center justify-center mb-3 sm:mb-4">
                            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none mb-0.5">
                            0
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Messages
                        </p>
                        <Link
                            href="/dashboard/messages"
                            className="text-xs text-teal-600 hover:text-teal-800 font-semibold
                                transition-colors"
                        >
                            Open inbox →
                        </Link>
                    </div>
                </div>

                {/* ── ACTION BANNERS — inspection & pending reviews ── */}
                {(inspectionOrders.length > 0 || pendingReviews.length > 0) && (
                    <div className="flex flex-col gap-3 mb-6">

                        {/* Inspection banner */}
                        {inspectionOrders.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl
                                p-4 sm:p-5 flex items-start sm:items-center gap-4
                                animate-[fadeUp_.4s_ease_both]">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center
                                    justify-center shrink-0">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-amber-800">
                                        {inspectionOrders.length === 1
                                            ? '1 order is awaiting your inspection'
                                            : `${inspectionOrders.length} orders are awaiting your inspection`
                                        }
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                                        Review the device and approve to release payment, or open a dispute if something&apos;s wrong.
                                    </p>
                                </div>
                                <Link
                                    href="/dashboard/orders"
                                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400
                                        text-white font-semibold text-xs px-4 py-2.5 rounded-xl
                                        transition-all hover:shadow-md shrink-0 whitespace-nowrap"
                                >
                                    Review Now
                                    <ArrowRightIcon className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}

                        {/* Pending review banner */}
                        {pendingReviews.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl
                                p-4 sm:p-5 flex items-start sm:items-center gap-4
                                animate-[fadeUp_.4s_ease_both_.1s]">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center
                                    justify-center shrink-0">
                                    <StarIcon className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-blue-800">
                                        You have {pendingReviews.length} review{pendingReviews.length !== 1 ? 's' : ''} pending
                                    </p>
                                    <p className="text-xs text-blue-600 mt-0.5">
                                        Help other buyers by sharing your experience.
                                    </p>
                                </div>
                                <Link
                                    href={`/orders/${pendingReviews[0].id}`}
                                    className="flex items-center gap-1.5 border-2 border-blue-300
                                        text-blue-700 hover:bg-blue-100 font-semibold text-xs
                                        px-4 py-2 rounded-xl transition-colors shrink-0 whitespace-nowrap"
                                >
                                    Leave Review
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* ── MAIN GRID: orders left | sidebar right ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 sm:gap-6">

                    {/* ══ LEFT: Recent Purchases ══ */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-gray-900">Recent Purchases</h2>
                            <Link
                                href="/dashboard/orders"
                                className="text-sm font-semibold text-teal-700 hover:text-teal-900
                                    flex items-center gap-1 transition-colors"
                            >
                                View all <ArrowRightIcon className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {orders.length === 0 ? (
                            /* ── Empty state ── */
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200
                                p-14 flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center
                                    justify-center mb-4">
                                    <ShoppingBagIcon className="w-7 h-7 text-teal-600" />
                                </div>
                                <p className="text-base font-semibold text-gray-700 mb-1">
                                    No purchases yet
                                </p>
                                <p className="text-sm text-gray-400 mb-5 max-w-xs leading-relaxed">
                                    Browse our verified devices and make your first purchase — every order is escrow protected.
                                </p>
                                <Link
                                    href="/devices"
                                    className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                                        text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                                        transition-all hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    Browse Devices
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {orders.map((order, i) => {
                                    // Supabase join returns typed object — cast for safe access
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const product = order.product as any
                                    const isInspection = order.status === 'in_inspection'

                                    return (
                                        <Link
                                            key={order.id}
                                            href={`/orders/${order.id}`}
                                            className={`group bg-white rounded-2xl border shadow-sm
                                                hover:shadow-md transition-all duration-200
                                                p-4 flex items-center gap-3 sm:gap-4
                                                animate-[fadeUp_.35s_ease_both]
                                                ${isInspection
                                                    ? 'border-amber-200 hover:border-amber-300'
                                                    : 'border-gray-100 hover:border-teal-200'
                                                }`}
                                            style={{ animationDelay: `${i * 50}ms` }}
                                        >
                                            {/* Device thumbnail */}
                                            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl
                                                bg-gray-50 border border-gray-100 flex items-center
                                                justify-center shrink-0 overflow-hidden">
                                                {product?.images?.[0] ? (
                                                    <Image
                                                        src={product.images[0]}
                                                        alt={product.title ?? ''}
                                                        width={56}
                                                        height={56}
                                                        className="w-full h-full object-contain p-1"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <span className="text-2xl">📱</span>
                                                )}
                                            </div>

                                            {/* Info block */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                                        ${STATUS_PILL_STYLES[order.status as OrderStatus]}`}>
                                                        {STATUS_LABELS[order.status as OrderStatus]}
                                                    </span>
                                                    {isInspection && (
                                                        <span className="text-[9px] font-bold text-amber-700
                                                            bg-amber-100 px-1.5 py-0.5 rounded-full animate-pulse">
                                                            Action needed
                                                        </span>
                                                    )}
                                                </div>
                                                {product?.brand && (
                                                    <p className="text-[11px] font-bold text-teal-600
                                                        uppercase tracking-widest mb-0.5">
                                                        {product.brand?.name}
                                                    </p>
                                                )}
                                                <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                                                    {product?.title ?? 'Device'}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
                                                    #{order.id.slice(0, 8).toUpperCase()}
                                                    {' · '}
                                                    {relativeDate(order.created_at)}
                                                </p>
                                            </div>

                                            {/* Price + arrow */}
                                            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {fmtUSD(Number(order.total ?? 0))}
                                                </span>
                                                <ChevronRightIcon className="w-4 h-4 text-gray-300
                                                    group-hover:text-teal-500 transition-colors" />
                                            </div>
                                        </Link>
                                    )
                                })}

                                {/* "See all" link when there are more */}
                                <Link
                                    href="/dashboard/orders"
                                    className="flex items-center justify-center gap-2 py-3.5
                                        border-2 border-dashed border-gray-200 hover:border-teal-400
                                        text-sm font-semibold text-gray-400 hover:text-teal-700
                                        rounded-2xl transition-all duration-200"
                                >
                                    View full order history
                                    <ArrowRightIcon className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* ══ RIGHT: Quick Actions + Watchlist Preview + Protection ══ */}
                    <div className="flex flex-col gap-4">

                        {/* Quick Actions card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
                            <div className="flex flex-col gap-1">
                                {[
                                    {
                                        label: 'Track All Orders',
                                        desc: 'Escrow status & shipping',
                                        href: '/dashboard/orders',
                                        icon: TruckIcon,
                                        badge: activeOrders.length > 0
                                            ? `${activeOrders.length} active`
                                            : undefined,
                                    },
                                    {
                                        label: 'My Watchlist',
                                        desc: `${watchlistCount} saved device${watchlistCount !== 1 ? 's' : ''}`,
                                        href: '/watchlist',
                                        icon: HeartIcon,
                                        badge: undefined,
                                    },
                                    {
                                        label: 'Messages',
                                        desc: 'Chat with sellers',
                                        href: '/dashboard/messages',
                                        icon: ChatBubbleLeftEllipsisIcon,
                                        badge: undefined,
                                    },
                                    {
                                        label: 'Browse Devices',
                                        desc: 'Find your next deal',
                                        href: '/devices',
                                        icon: TagIcon,
                                        badge: undefined,
                                    },
                                ].map(({ label, desc, href, icon: Icon, badge }) => (
                                    <Link
                                        key={label}
                                        href={href}
                                        className="flex items-center gap-3 p-3 rounded-xl
                                            hover:bg-gray-50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center
                                            justify-center shrink-0">
                                            <Icon className="w-4 h-4 text-teal-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800
                                                group-hover:text-teal-700 transition-colors leading-tight">
                                                {label}
                                            </p>
                                            <p className="text-xs text-gray-400">{desc}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {badge && (
                                                <span className="text-[10px] font-bold bg-amber-100
                                                    text-amber-700 px-2 py-0.5 rounded-full">
                                                    {badge}
                                                </span>
                                            )}
                                            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300
                                                group-hover:text-teal-400 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Watchlist Preview */}
                        {watchlistItems.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4
                                    border-b border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <HeartSolid className="w-4 h-4 text-red-400" />
                                        Watchlist
                                    </h3>
                                    <Link
                                        href="/watchlist"
                                        className="text-xs font-semibold text-teal-700 hover:text-teal-900
                                            transition-colors"
                                    >
                                        See all ({watchlistCount}) →
                                    </Link>
                                </div>

                                <div className="divide-y divide-gray-50">
                                    {watchlistItems.map((entry) => {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const p = entry.product as any
                                        if (!p) return null

                                        const discount = p.original_price && p.original_price > p.price
                                            ? Math.round((1 - p.price / p.original_price) * 100)
                                            : 0

                                        return (
                                            <Link
                                                key={entry.id}
                                                href={`/devices/${p.id}`}
                                                className="flex items-center gap-3 px-4 py-3
                                                    hover:bg-gray-50 transition-colors group"
                                            >
                                                {/* Thumbnail */}
                                                <div className="w-11 h-11 rounded-xl bg-gray-50
                                                    border border-gray-100 flex items-center justify-center
                                                    shrink-0 overflow-hidden">
                                                    {p.images?.[0] ? (
                                                        <Image
                                                            src={p.images[0]}
                                                            alt={p.title ?? ''}
                                                            width={44}
                                                            height={44}
                                                            className="w-full h-full object-contain p-0.5"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <span className="text-lg">📱</span>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 truncate
                                                        leading-snug group-hover:text-teal-700 transition-colors">
                                                        {p.title ?? '—'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                        <span className="text-xs font-bold text-gray-900">
                                                            ${p.price}
                                                        </span>
                                                        {discount > 0 && (
                                                            <span className="text-[10px] font-bold text-amber-600
                                                                bg-amber-50 px-1.5 py-0.5 rounded">
                                                                -{discount}%
                                                            </span>
                                                        )}
                                                        {p.condition && (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                                                                ${CONDITION_STYLE[p.condition] ?? 'bg-gray-100 text-gray-600'}`}>
                                                                {CONDITION_LABEL[p.condition] ?? p.condition}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                            </Link>
                                        )
                                    })}
                                </div>

                                {/* Footer link to full watchlist */}
                                <Link
                                    href="/watchlist"
                                    className="flex items-center justify-center gap-1.5 py-3
                                        border-t border-gray-50 text-xs font-semibold text-teal-700
                                        hover:bg-teal-50 transition-colors"
                                >
                                    View full watchlist
                                    <ArrowRightIcon className="w-3 h-3" />
                                </Link>
                            </div>
                        )}

                        {/* Empty watchlist CTA */}
                        {watchlistItems.length === 0 && (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200
                                p-6 text-center">
                                <HeartIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                    Your watchlist is empty
                                </p>
                                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                    Tap ♡ on any device to save it here and track prices.
                                </p>
                                <Link
                                    href="/devices"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold
                                        text-teal-700 border border-teal-200 hover:bg-teal-50
                                        px-4 py-2 rounded-xl transition-colors"
                                >
                                    Browse Devices
                                </Link>
                            </div>
                        )}

                        {/* Buyer Protection Card */}
                        <div className="bg-gradient-to-br from-teal-800 to-teal-700 rounded-2xl
                            p-5 sm:p-6 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheckIcon className="w-4 h-4" />
                                <h3 className="text-sm font-bold">Buyer Protection</h3>
                            </div>
                            <p className="text-xs text-teal-200 mb-4 leading-relaxed">
                                Every purchase on Go2Hand is escrow-protected. Your money is held
                                safe until you inspect and approve the device.
                            </p>
                            <div className="flex flex-col gap-2">
                                {[
                                    '5-day inspection window after delivery',
                                    'IMEI verified against stolen databases',
                                    '30-day hassle-free return policy',
                                    'Dispute resolution within 24 hours',
                                ].map(item => (
                                    <div key={item} className="flex items-center gap-2 text-xs text-teal-100">
                                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export const metadata = {
    title: 'Buyer Dashboard — Go2Hand',
    description: 'Track your purchases, watchlist, and orders on Go2Hand.',
}