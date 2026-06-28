// src/app/admin/analytics/page.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN — ANALYTICS DASHBOARD — /admin/analytics
//
// Server Component: fetches all time-series + aggregate data from
// Supabase and passes it to <AnalyticsDashboard> (client component)
// which renders charts, KPI cards, and the activity feed.
//
// Data sections fetched here:
//   1. KPI snapshot  — revenue, GMV, orders, users (this week vs last week)
//   2. Revenue series — daily platform fee income for the last 30 days
//   3. Orders series  — daily order counts by status (last 30 days)
//   4. User growth    — daily new signups (last 30 days)
//   5. Category mix   — active listing count per category
//   6. Order funnel   — conversion: paid → shipped → inspection → completed
//   7. IMEI stats     — clean vs flagged verification counts
//   8. Top sellers    — top 8 sellers by completed sales + earnings
//   9. Recent orders  — last 10 orders for the activity feed
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

// ── Types exported to the client component ────────────────────────

export interface DailyStat {
    date: string          // 'YYYY-MM-DD'
    value: number
}

export interface CategoryStat {
    name: string
    count: number
    slug: string
    color: string
}

export interface FunnelStep {
    label: string
    count: number
    pct: number           // relative to the first step
}

export interface TopSeller {
    id: string
    username: string
    fullName: string | null
    avatarUrl: string | null
    totalSales: number
    earnings: number      // sum of (amount - platform_fee) for their completed orders
    rating: number
    isVerified: boolean
}

export interface RecentOrder {
    id: string
    status: string
    amount: number
    createdAt: string
    buyerUsername: string | null
    sellerUsername: string | null
    productTitle: string | null
    productImage: string | null
}

export interface AnalyticsData {
    // KPI cards
    kpi: {
        totalGMV: number          // sum of all completed order amounts
        totalRevenue: number      // sum of platform fees
        totalOrders: number
        totalUsers: number
        activeListings: number
        avgOrderValue: number
        // Week-over-week deltas (positive = growth, in percentage points)
        gMVDeltaPct: number
        ordersDeltaPct: number
        usersDeltaPct: number
        revenueDeltaPct: number
    }
    // Time series (last 30 days)
    revenueSeries: DailyStat[]
    ordersSeries: DailyStat[]
    usersSeries: DailyStat[]
    // Breakdowns
    categoryMix: CategoryStat[]
    funnel: FunnelStep[]
    imeiStats: { clean: number; flagged: number; unverified: number }
    // Tables
    topSellers: TopSeller[]
    recentOrders: RecentOrder[]
}

// ── Color palette for category pie slices ─────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    smartphones: '#0f766e',   // teal-700
    laptops:     '#0891b2',   // cyan-600
    tablets:     '#7c3aed',   // violet-600
    watches:     '#d97706',   // amber-600
    audio:       '#059669',   // emerald-600
    desktops:    '#dc2626',   // red-600
}

// ── Build date range helpers ──────────────────────────────────────

/** Returns 'YYYY-MM-DD' for N days ago */
function daysAgo(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().split('T')[0]
}

/** Generate a full array of date strings for the last N days */
function lastNDates(n: number): string[] {
    return Array.from({ length: n }, (_, i) => daysAgo(n - 1 - i))
}

// ── Supabase SSR client ───────────────────────────────────────────
async function createSupa() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
}

// ── Safe delta calculation (avoids division-by-zero) ─────────────
function deltaPct(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
}

// ─────────────────────────────────────────────────────────────────
// MAIN DATA FETCH
// ─────────────────────────────────────────────────────────────────
async function fetchAnalytics(): Promise<AnalyticsData> {
    const supabase = await createSupa()

    const thirtyDaysAgo  = daysAgo(30)
    const sevenDaysAgo   = daysAgo(7)
    const fourteenDaysAgo = daysAgo(14)
    const dates30        = lastNDates(30)

    // ── Run all queries in parallel for speed ─────────────────────
    const [
        // 1. Completed orders — GMV + revenue calculation
        completedOrdersRes,

        // 2. All orders — total count + funnel data
        allOrdersRes,

        // 3. Orders last 30 days — daily series
        orders30Res,

        // 4. Orders this week vs last week — delta
        ordersThisWeekRes,
        ordersLastWeekRes,

        // 5. Users — total + weekly growth
        totalUsersRes,
        usersThisWeekRes,
        usersLastWeekRes,

        // 6. Users last 30 days — daily signups
        users30Res,

        // 7. Active listings by category
        listingsByCatRes,

        // 8. Verification logs — IMEI stats
        imeiCleanRes,
        imeiFlaggedRes,

        // 9. Top sellers
        topSellersRes,

        // 10. Recent orders for activity feed
        recentOrdersRes,
    ] = await Promise.all([

        // 1. Completed orders for GMV + revenue
        supabase
            .from('orders')
            .select('amount, platform_fee, created_at')
            .eq('status', 'completed'),

        // 2. All orders — for funnel
        supabase
            .from('orders')
            .select('status, amount'),

        // 3. Orders last 30 days (daily count)
        supabase
            .from('orders')
            .select('created_at, status')
            .gte('created_at', thirtyDaysAgo),

        // 4. Orders this week
        supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo),

        // 5. Orders last week (7–14 days ago)
        supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', fourteenDaysAgo)
            .lt('created_at', sevenDaysAgo),

        // 6. Total users
        supabase
            .from('users')
            .select('id', { count: 'exact', head: true }),

        // 7. Users this week
        supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', sevenDaysAgo),

        // 8. Users last week
        supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', fourteenDaysAgo)
            .lt('created_at', sevenDaysAgo),

        // 9. Users daily signups (last 30 days)
        supabase
            .from('users')
            .select('created_at')
            .gte('created_at', thirtyDaysAgo),

        // 10. Active listings grouped by category
        supabase
            .from('products')
            .select(`
                category:categories ( name, slug )
            `)
            .eq('status', 'active'),

        // 11. IMEI clean verifications
        supabase
            .from('verification_logs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'clean')
            .not('identifier_hash', 'like', 'admin_decision:%'),

        // 12. IMEI flagged verifications
        supabase
            .from('verification_logs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'flagged')
            .not('identifier_hash', 'like', 'admin_decision:%'),

        // 13. Top sellers — join orders to get earnings
        supabase
            .from('orders')
            .select(`
                amount, platform_fee, seller_id,
                seller:users!seller_id (
                    id, username, full_name, avatar_url,
                    seller_rating, total_sales, verified
                )
            `)
            .eq('status', 'completed'),

        // 14. Recent orders for activity feed
        supabase
            .from('orders')
            .select(`
                id, status, amount, created_at,
                buyer:users!buyer_id ( username ),
                seller:users!seller_id ( username ),
                product:products ( title, images )
            `)
            .order('created_at', { ascending: false })
            .limit(10),
    ])

    // ── 1. KPI — GMV & revenue ────────────────────────────────────
    const completedOrders = completedOrdersRes.data ?? []
    const totalGMV        = completedOrders.reduce((s, o) => s + Number(o.amount ?? 0), 0)
    const totalRevenue    = completedOrders.reduce((s, o) => s + Number(o.platform_fee ?? 0), 0)
    const avgOrderValue   = completedOrders.length > 0 ? totalGMV / completedOrders.length : 0

    // Revenue this week vs last week (from completed orders)
    const revThisWeek = completedOrders
        .filter(o => o.created_at >= sevenDaysAgo)
        .reduce((s, o) => s + Number(o.platform_fee ?? 0), 0)
    const revLastWeek = completedOrders
        .filter(o => o.created_at >= fourteenDaysAgo && o.created_at < sevenDaysAgo)
        .reduce((s, o) => s + Number(o.platform_fee ?? 0), 0)

    // ── 2. KPI deltas ─────────────────────────────────────────────
    const totalOrders    = allOrdersRes.data?.length ?? 0
    const totalUsers     = totalUsersRes.count ?? 0
    const ordersThisWeek = ordersThisWeekRes.count ?? 0
    const ordersLastWeek = ordersLastWeekRes.count ?? 0
    const usersThisWeek  = usersThisWeekRes.count ?? 0
    const usersLastWeek  = usersLastWeekRes.count ?? 0

    // ── 3. Revenue daily series ───────────────────────────────────
    // Group completed orders by date
    const revByDate = new Map<string, number>()
    for (const o of completedOrders) {
        if (!o.created_at) continue
        const date = o.created_at.split('T')[0]
        revByDate.set(date, (revByDate.get(date) ?? 0) + Number(o.platform_fee ?? 0))
    }
    const revenueSeries: DailyStat[] = dates30.map(date => ({
        date,
        value: Math.round((revByDate.get(date) ?? 0) * 100) / 100,
    }))

    // ── 4. Orders daily series ────────────────────────────────────
    const ordersByDate = new Map<string, number>()
    for (const o of orders30Res.data ?? []) {
        if (!o.created_at) continue
        const date = o.created_at.split('T')[0]
        ordersByDate.set(date, (ordersByDate.get(date) ?? 0) + 1)
    }
    const ordersSeries: DailyStat[] = dates30.map(date => ({
        date,
        value: ordersByDate.get(date) ?? 0,
    }))

    // ── 5. Users daily series ─────────────────────────────────────
    const usersByDate = new Map<string, number>()
    for (const u of users30Res.data ?? []) {
        if (!u.created_at) continue
        const date = u.created_at.split('T')[0]
        usersByDate.set(date, (usersByDate.get(date) ?? 0) + 1)
    }
    const usersSeries: DailyStat[] = dates30.map(date => ({
        date,
        value: usersByDate.get(date) ?? 0,
    }))

    // ── 6. Active listings by category ───────────────────────────
    const catCounts = new Map<string, { name: string; slug: string; count: number }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of listingsByCatRes.data ?? []) {
        const cat = (row as any).category
        if (!cat?.slug) continue
        const existing = catCounts.get(cat.slug)
        if (existing) {
            existing.count++
        } else {
            catCounts.set(cat.slug, { name: cat.name ?? cat.slug, slug: cat.slug, count: 1 })
        }
    }
    const categoryMix: CategoryStat[] = Array.from(catCounts.values())
        .sort((a, b) => b.count - a.count)
        .map(c => ({
            ...c,
            color: CATEGORY_COLORS[c.slug] ?? '#6b7280',
        }))

    // Total active listings
    const activeListings = listingsByCatRes.data?.length ?? 0

    // ── 7. Order funnel ───────────────────────────────────────────
    const allOrders = allOrdersRes.data ?? []
    const funnelCounts = {
        paid:          allOrders.filter(o => ['paid', 'shipped', 'in_inspection', 'completed'].includes(o.status)).length,
        shipped:       allOrders.filter(o => ['shipped', 'in_inspection', 'completed'].includes(o.status)).length,
        in_inspection: allOrders.filter(o => ['in_inspection', 'completed'].includes(o.status)).length,
        completed:     allOrders.filter(o => o.status === 'completed').length,
    }
    const base = funnelCounts.paid || 1
    const funnel: FunnelStep[] = [
        { label: 'Payment Secured',    count: funnelCounts.paid,          pct: 100 },
        { label: 'Shipped',            count: funnelCounts.shipped,        pct: Math.round((funnelCounts.shipped / base) * 100) },
        { label: 'Inspection Started', count: funnelCounts.in_inspection,  pct: Math.round((funnelCounts.in_inspection / base) * 100) },
        { label: 'Completed',          count: funnelCounts.completed,      pct: Math.round((funnelCounts.completed / base) * 100) },
    ]

    // ── 8. IMEI stats ─────────────────────────────────────────────
    const imeiClean    = imeiCleanRes.count ?? 0
    const imeiFlagged  = imeiFlaggedRes.count ?? 0
    const imeiTotal    = imeiClean + imeiFlagged
    const imeiStats    = {
        clean:      imeiClean,
        flagged:    imeiFlagged,
        unverified: 0, // would need products table join; keep 0 for now
    }

    // ── 9. Top sellers ────────────────────────────────────────────
    // Aggregate by seller_id from completed orders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerMap = new Map<string, { seller: any; totalSales: number; earnings: number }>()
    for (const o of topSellersRes.data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = (o as any).seller
        if (!s?.id) continue
        const existing = sellerMap.get(s.id)
        const payout = Number(o.amount ?? 0) - Number(o.platform_fee ?? 0)
        if (existing) {
            existing.totalSales++
            existing.earnings += payout
        } else {
            sellerMap.set(s.id, { seller: s, totalSales: 1, earnings: payout })
        }
    }
    const topSellers: TopSeller[] = Array.from(sellerMap.values())
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 8)
        .map(({ seller, totalSales, earnings }) => ({
            id:          seller.id,
            username:    seller.username ?? '—',
            fullName:    seller.full_name ?? null,
            avatarUrl:   seller.avatar_url ?? null,
            totalSales,
            earnings:    Math.round(earnings * 100) / 100,
            rating:      Number(seller.seller_rating ?? 0),
            isVerified:  seller.verified === 'verified',
        }))

    // ── 10. Recent orders ─────────────────────────────────────────
    const recentOrders: RecentOrder[] = (recentOrdersRes.data ?? []).map((o: any) => ({
        id:             o.id,
        status:         o.status,
        amount:         Number(o.amount ?? 0),
        createdAt:      o.created_at,
        buyerUsername:  o.buyer?.username ?? null,
        sellerUsername: o.seller?.username ?? null,
        productTitle:   o.product?.title ?? null,
        productImage:   o.product?.images?.[0] ?? null,
    }))

    return {
        kpi: {
            totalGMV,
            totalRevenue,
            totalOrders,
            totalUsers,
            activeListings,
            avgOrderValue,
            gMVDeltaPct:     deltaPct(revThisWeek, revLastWeek),   // proxy using revenue (same trend)
            ordersDeltaPct:  deltaPct(ordersThisWeek, ordersLastWeek),
            usersDeltaPct:   deltaPct(usersThisWeek, usersLastWeek),
            revenueDeltaPct: deltaPct(revThisWeek, revLastWeek),
        },
        revenueSeries,
        ordersSeries,
        usersSeries,
        categoryMix,
        funnel,
        imeiStats,
        topSellers,
        recentOrders,
    }
}

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────
export default async function AdminAnalyticsPage() {
    const data = await fetchAnalytics()

    return (
        <div className="flex flex-col gap-5">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    Business intelligence — revenue, growth, and marketplace health.
                </p>
            </div>

            {/* All charts and tables — client component for interactivity */}
            <AnalyticsDashboard data={data} />
        </div>
    )
}

export const metadata = {
    title: 'Analytics — Go2Hand Admin',
}