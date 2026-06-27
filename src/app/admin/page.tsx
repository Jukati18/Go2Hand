// src/app/admin/page.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN OVERVIEW — /admin
//
// High-level stats: total users, listings, orders, revenue.
// Quick-access cards to each admin section.
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import {
    UsersIcon,
    DevicePhoneMobileIcon,
    ShoppingBagIcon,
    CurrencyDollarIcon,
    ArrowRightIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    FlagIcon,
} from '@heroicons/react/24/outline'

async function getAdminStats() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } } }
    )

    const [
        usersCountRes,
        activeListingsRes,
        totalOrdersRes,
        completedOrdersRes,
        disputedOrdersRes,
        newUsersRes,
        totalReportsRes,
        pendingReportsRes,
    ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('amount, platform_fee').eq('status', 'completed'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
        // Users joined in last 7 days
        supabase.from('users').select('id', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('reports').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const totalRevenue = (completedOrdersRes.data ?? []).reduce(
        (sum, o) => sum + Number(o.platform_fee ?? 0), 0
    )

    return {
        totalUsers: usersCountRes.count ?? 0,
        activeListings: activeListingsRes.count ?? 0,
        totalOrders: totalOrdersRes.count ?? 0,
        completedOrders: completedOrdersRes.data?.length ?? 0,
        disputedOrders: disputedOrdersRes.count ?? 0,
        totalRevenue,
        newUsersThisWeek: newUsersRes.count ?? 0,
        totalReports: totalReportsRes.count ?? 0,
        pendingReports: pendingReportsRes.count ?? 0,
    }
}

function fmtUSD(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n)
}

export default async function AdminOverviewPage() {
    const stats = await getAdminStats()

    const STAT_CARDS = [
        {
            label: 'Total Users',
            value: stats.totalUsers.toLocaleString(),
            sub: `+${stats.newUsersThisWeek} this week`,
            icon: UsersIcon,
            color: 'blue',
            href: '/admin/users',
        },
        {
            label: 'Active Listings',
            value: stats.activeListings.toLocaleString(),
            sub: 'Visible to buyers',
            icon: DevicePhoneMobileIcon,
            color: 'teal',
            href: '/admin/listings',
        },
        {
            label: 'Total Orders',
            value: stats.totalOrders.toLocaleString(),
            sub: `${stats.completedOrders} completed`,
            icon: ShoppingBagIcon,
            color: 'emerald',
            href: '/admin/orders',
        },
        {
            label: 'Platform Revenue',
            value: fmtUSD(stats.totalRevenue),
            sub: '5% fee on completed sales',
            icon: CurrencyDollarIcon,
            color: 'amber',
            href: '/admin/orders',
        },
        {
            label: 'Content Reports',
            value: stats.totalReports.toLocaleString(),
            sub: `${stats.pendingReports} pending review`,
            icon: FlagIcon,
            color: 'orange',
            href: '/admin/reports',
        },
    ]

    const COLOR_MAP: Record<string, { bg: string; icon: string; text: string }> = {
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-900' },
        teal: { bg: 'bg-teal-50', icon: 'text-teal-600', text: 'text-teal-900' },
        emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-900' },
        amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-900' },
        orange: { bg: 'bg-orange-100', icon: 'text-orange-600', text: 'text-orange-900' },
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Overview</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    Platform health at a glance — live data from Supabase.
                </p>
            </div>

            {/* Alert: disputed orders */}
            {stats.disputedOrders > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center
                    gap-3 animate-[fadeUp_.3s_ease_both]">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-800">
                            {stats.disputedOrders} order{stats.disputedOrders !== 1 ? 's' : ''} under dispute
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                            Requires admin review within 24 hours.
                        </p>
                    </div>
                    <Link href="/admin/orders"
                        className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200
                            px-4 py-2 rounded-xl transition-colors shrink-0">
                        Review Now
                    </Link>
                </div>
            )}

            {/* Stat cards — 2-col → 4-col lg */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {STAT_CARDS.map(({ label, value, sub, icon: Icon, color, href }) => {
                    const c = COLOR_MAP[color]
                    return (
                        <Link
                            key={label}
                            href={href}
                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm
                                p-4 sm:p-5 hover:border-gray-300 hover:shadow-md transition-all
                                duration-200 hover:-translate-y-0.5"
                        >
                            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center
                                justify-center mb-3`}>
                                <Icon className={`w-5 h-5 ${c.icon}`} />
                            </div>
                            <p className="text-2xl font-black text-gray-900 leading-none mb-1">
                                {value}
                            </p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                                {label}
                            </p>
                            <p className="text-xs text-gray-400">{sub}</p>
                        </Link>
                    )
                })}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Admin Sections</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        {
                            label: 'User Management',
                            desc: 'View all users, verify sellers, ban accounts',
                            href: '/admin/users',
                            icon: UsersIcon,
                            badge: `${stats.totalUsers} users`,
                        },
                        {
                            label: 'Device Listings',
                            desc: 'Review, approve, or remove device listings',
                            href: '/admin/listings',
                            icon: DevicePhoneMobileIcon,
                            badge: `${stats.activeListings} active`,
                        },
                        {
                            label: 'Order Management',
                            desc: 'Track escrow orders, resolve disputes',
                            href: '/admin/orders',
                            icon: ShoppingBagIcon,
                            badge: stats.disputedOrders > 0
                                ? `${stats.disputedOrders} disputed`
                                : `${stats.totalOrders} total`,
                            urgent: stats.disputedOrders > 0,
                        },
                        {
                            label: 'Seller Verification',
                            desc: 'Review and approve seller verification requests',
                            href: '/admin/users?filter=pending_verification',
                            icon: ShieldCheckIcon,
                            badge: 'Pending review',
                        },
                        {
                            label: 'Content Moderation',
                            desc: 'Review user-submitted reports, ban bad actors',
                            href: '/admin/reports',
                            icon: FlagIcon,
                            badge: stats.pendingReports > 0
                                ? `${stats.pendingReports} pending`
                                : 'Queue clear',
                            urgent: stats.pendingReports > 0,
                        },
                    ].map(({ label, desc, href, icon: Icon, badge, urgent }) => (
                        <Link
                            key={label}
                            href={href}
                            className="flex items-start gap-3 p-4 rounded-xl border border-gray-100
                                hover:border-teal-300 hover:bg-teal-50 transition-all group"
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                ${urgent ? 'bg-red-100' : 'bg-gray-100'}`}>
                                <Icon className={`w-4.5 h-4.5 ${urgent ? 'text-red-600' : 'text-gray-500'}`}
                                    style={{ width: 18, height: 18 }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-800
                                        transition-colors leading-tight">
                                        {label}
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                        ${urgent
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {badge}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 leading-snug">{desc}</p>
                            </div>
                            <ArrowRightIcon className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-500
                                shrink-0 mt-0.5 transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export const metadata = {
    title: 'Admin Overview — Go2Hand',
}