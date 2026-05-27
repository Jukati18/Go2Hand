// src/app/dashboard/page.tsx
// ─────────────────────────────────────────────────────────────────
// SELLER DASHBOARD — Overview
//
// Shows: Total earnings, pending sales count, active listings,
//        verification status, lifetime stats, quick nav cards,
//        and a preview of the 3 most recent listings.
//
// This is a Server Component — all data is fetched on the server
// before the page renders. No loading spinners needed.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'
import Image from 'next/image'
import {
    CurrencyDollarIcon,
    ClockIcon,
    TagIcon,
    ShieldCheckIcon,
    ArrowRightIcon,
    PlusIcon,
    ChartBarIcon,
    StarIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ── Status badge colours ──────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
    active:         'bg-emerald-100 text-emerald-700',
    sold:           'bg-blue-100 text-blue-700',
    inactive:       'bg-gray-100 text-gray-500',
    pending_review: 'bg-amber-100 text-amber-700',
}

// ── Format USD ────────────────────────────────────────────────────
function fmtUSD(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n)
}

// ── Build Supabase SSR client ─────────────────────────────────────
async function makeSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => {},           // read-only is fine for server pages
            },
        }
    )
}

// ══════════════════════════════════════════════════════════════════
export default async function SellerDashboardPage() {

    // ── 1. Auth guard ─────────────────────────────────────────────
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?next=/dashboard')

    // ── 2. Fetch everything in parallel (one round-trip) ─────────
    const [
        completedOrdersRes,  // for earnings calculation
        pendingCountRes,     // orders awaiting seller action
        activeCountRes,      // live listings count
        profileRes,          // verification status + rating
        recentListingsRes,   // last 3 listings for the preview
    ] = await Promise.all([

        // All completed orders where this user is the seller
        supabase
            .from('orders')
            .select('amount, platform_fee')
            .eq('seller_id', user.id)
            .eq('status', 'completed'),

        // Pending orders: buyer paid but hasn't confirmed receipt yet
        supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .in('status', ['paid', 'shipped', 'in_inspection']),

        // Count of active (publicly visible) listings
        supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', user.id)
            .eq('status', 'active'),

        // Public profile — verification, rating, sales count
        supabase
            .from('users')
            .select('username, full_name, verified, seller_rating, total_sales, total_reviews')
            .eq('id', user.id)
            .single(),

        // 3 newest listings for the dashboard preview row
        supabase
            .from('products')
            .select(`
                id, title, price, status, images,
                storage_capacity, view_count, created_at,
                brand:brands ( name )
            `)
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
    ])

    // ── 3. Derive stats ───────────────────────────────────────────

    // Payout = selling price minus the 5% platform fee
    const totalEarnings = (completedOrdersRes.data ?? []).reduce(
        (sum, o) => sum + (Number(o.amount) - Number(o.platform_fee ?? 0)),
        0
    )

    const pendingCount   = pendingCountRes.count ?? 0
    const activeCount    = activeCountRes.count ?? 0
    const profile        = profileRes.data
    const isVerified     = profile?.verified === 'verified'
    const displayName    = profile?.full_name ?? profile?.username ?? 'Seller'
    const totalSales     = profile?.total_sales ?? 0
    const sellerRating   = Number(profile?.seller_rating ?? 0)
    const totalReviews   = profile?.total_reviews ?? 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentListings = (recentListingsRes.data ?? []) as any[]

    // ── 4. Render ─────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />

            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">

                {/* ── PAGE HEADER ── */}
                <div className="flex items-start justify-between mb-7 flex-wrap gap-4">
                    <div>
                        <p className="text-sm text-gray-400 font-medium mb-0.5">Welcome back,</p>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                            {displayName} 👋
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Your seller overview — all numbers are live.
                        </p>
                    </div>

                    {/* Primary CTA — always visible */}
                    <Link
                        href="/sell"
                        className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                            text-white font-semibold px-5 py-3 rounded-xl text-sm
                            transition-all hover:-translate-y-0.5 hover:shadow-lg shrink-0"
                    >
                        <PlusIcon className="w-4 h-4" />
                        List New Device
                    </Link>
                </div>

                {/* ── STAT CARDS — 1-col → 2-col sm → 4-col lg ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">

                    {/* Earnings */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50
                                px-2 py-0.5 rounded-full uppercase tracking-wide">
                                After fees
                            </span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-none mb-1">
                            {fmtUSD(totalEarnings)}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Total Earnings
                        </p>
                        <p className="text-xs text-gray-400">
                            From {completedOrdersRes.data?.length ?? 0} completed sale
                            {(completedOrdersRes.data?.length ?? 0) !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Pending Sales */}
                    <div className={`rounded-2xl border shadow-sm p-5 transition-colors ${
                        pendingCount > 0
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                pendingCount > 0 ? 'bg-amber-100' : 'bg-gray-100'
                            }`}>
                                <ClockIcon className={`w-5 h-5 ${
                                    pendingCount > 0 ? 'text-amber-500' : 'text-gray-400'
                                }`} />
                            </div>
                            {pendingCount > 0 && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100
                                    px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                                    Action needed
                                </span>
                            )}
                        </div>
                        <p className={`text-2xl sm:text-3xl font-black leading-none mb-1 ${
                            pendingCount > 0 ? 'text-amber-800' : 'text-gray-900'
                        }`}>
                            {pendingCount}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Pending Sales
                        </p>
                        <p className="text-xs text-gray-400">
                            In escrow or awaiting shipment
                        </p>
                    </div>

                    {/* Active Listings */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                                <TagIcon className="w-5 h-5 text-teal-600" />
                            </div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-none mb-1">
                            {activeCount}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                            Active Listings
                        </p>
                        <p className="text-xs text-gray-400">
                            Live on the marketplace
                        </p>
                    </div>

                    {/* Verification Status */}
                    <div className={`rounded-2xl border shadow-sm p-5 ${
                        isVerified
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-gray-100'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isVerified ? 'bg-emerald-100' : 'bg-gray-100'
                            }`}>
                                <ShieldCheckIcon className={`w-5 h-5 ${
                                    isVerified ? 'text-emerald-600' : 'text-gray-400'
                                }`} />
                            </div>
                            {isVerified && (
                                <ShieldSolid className="w-5 h-5 text-emerald-500" />
                            )}
                        </div>
                        <p className={`text-lg font-black leading-none mb-1 ${
                            isVerified ? 'text-emerald-800' : 'text-gray-700'
                        }`}>
                            {isVerified ? 'Verified ✓' : 'Not Verified'}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Seller Status
                        </p>
                        {isVerified ? (
                            <p className="text-xs text-emerald-600 font-medium">
                                Identity & listings confirmed
                            </p>
                        ) : (
                            <Link href="/get-verified"
                                className="text-xs font-semibold text-teal-700 hover:text-teal-900
                                    transition-colors underline underline-offset-2">
                                Apply to get verified →
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── LIFETIME STATS ROW — only show when there's data ─── */}
                {(totalSales > 0 || sellerRating > 0 || totalReviews > 0) && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                            px-4 py-3.5 text-center">
                            <p className="text-xl font-black text-gray-900">{totalSales}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                Total Sold
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                            px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <p className="text-xl font-black text-gray-900">
                                    {sellerRating > 0 ? sellerRating.toFixed(1) : '—'}
                                </p>
                                {sellerRating > 0 && (
                                    <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                Avg. Rating
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                            px-4 py-3.5 text-center">
                            <p className="text-xl font-black text-gray-900">{totalReviews}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                Reviews
                            </p>
                        </div>
                    </div>
                )}

                {/* ── QUICK NAV CARDS — 1-col → 3-col sm ─────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    {[
                        {
                            label: 'Manage Listings',
                            desc: 'View, edit, deactivate your active listings',
                            href: '/dashboard/listings',
                            icon: TagIcon,
                            accent: 'teal',
                            badge: undefined as string | undefined,
                        },
                        {
                            label: 'Pending Orders',
                            desc: 'Track escrow status and ship devices',
                            href: '/dashboard/orders',
                            icon: ClockIcon,
                            accent: 'amber',
                            badge: pendingCount > 0 ? `${pendingCount} active` : undefined,
                        },
                        {
                            label: 'Public Profile',
                            desc: 'Preview how buyers see your seller page',
                            href: `/profile/${user.id}`,
                            icon: ChartBarIcon,
                            accent: 'blue',
                            badge: undefined,
                        },
                    ].map(({ label, desc, href, icon: Icon, accent, badge }) => (
                        <Link
                            key={label}
                            href={href}
                            className="group bg-white rounded-2xl border border-gray-100 shadow-sm
                                p-5 hover:border-teal-400 hover:shadow-md
                                transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    accent === 'teal' ? 'bg-teal-50' :
                                    accent === 'amber' ? 'bg-amber-50' : 'bg-blue-50'
                                }`}>
                                    <Icon className={`w-5 h-5 ${
                                        accent === 'teal' ? 'text-teal-600' :
                                        accent === 'amber' ? 'text-amber-500' : 'text-blue-600'
                                    }`} />
                                </div>
                                <div className="flex items-center gap-2">
                                    {badge && (
                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700
                                            px-2 py-0.5 rounded-full">
                                            {badge}
                                        </span>
                                    )}
                                    <ArrowRightIcon className="w-4 h-4 text-gray-300
                                        group-hover:text-teal-500 group-hover:translate-x-0.5
                                        transition-all duration-150" />
                                </div>
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-teal-800
                                transition-colors">
                                {label}
                            </p>
                            <p className="text-xs text-gray-400 leading-snug">{desc}</p>
                        </Link>
                    ))}
                </div>

                {/* ── RECENT LISTINGS PREVIEW ─────────────────────── */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">Recent Listings</h2>
                    <Link
                        href="/dashboard/listings"
                        className="text-sm font-semibold text-teal-700 hover:text-teal-900
                            flex items-center gap-1 transition-colors"
                    >
                        View all <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {recentListings.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {recentListings.map((listing) => {
                            const imgSrc  = Array.isArray(listing.images) ? listing.images[0] : null
                            const status  = String(listing.status ?? 'active')
                            const brand   = listing.brand?.name ?? '—'

                            return (
                                <div
                                    key={listing.id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm
                                        p-4 flex items-center gap-4
                                        animate-[fadeUp_.35s_ease_both]"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100
                                        flex items-center justify-center shrink-0 overflow-hidden">
                                        {imgSrc ? (
                                            <Image
                                                src={imgSrc}
                                                alt={listing.title}
                                                width={56} height={56}
                                                className="w-full h-full object-contain p-1"
                                                unoptimized
                                            />
                                        ) : (
                                            <span className="text-2xl">📱</span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                                ${STATUS_STYLE[status] ?? STATUS_STYLE.active}`}>
                                                {status === 'pending_review' ? 'Pending Review'
                                                    : status.charAt(0).toUpperCase() + status.slice(1)}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(listing.created_at).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-0.5">
                                            {brand}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {listing.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-sm font-bold text-gray-900">
                                                ${Number(listing.price).toLocaleString()}
                                            </span>
                                            <span className="text-gray-300 text-xs">·</span>
                                            <span className="text-xs text-gray-400">
                                                {listing.view_count ?? 0} views
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link
                                            href={`/devices/${listing.id}`}
                                            className="text-xs font-semibold text-gray-500 hover:text-teal-700
                                                px-3 py-1.5 rounded-lg border border-gray-200
                                                hover:border-teal-400 transition-all"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href="/dashboard/listings"
                                            className="text-xs font-semibold text-teal-700 hover:text-teal-900
                                                px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100
                                                transition-colors"
                                        >
                                            Manage
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    /* Empty state */
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200
                        p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center
                            justify-center mb-4">
                            <TagIcon className="w-8 h-8 text-teal-600" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No listings yet</h3>
                        <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">
                            List your first device and start earning. It takes under 5 minutes.
                        </p>
                        <Link
                            href="/sell"
                            className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                                text-white font-semibold px-6 py-3 rounded-xl text-sm
                                transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <PlusIcon className="w-4 h-4" />
                            List Your First Device
                        </Link>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}

export const metadata = {
    title: 'Seller Dashboard — Go2Hand',
    description: 'Manage your listings, track earnings, and view your seller stats.',
}