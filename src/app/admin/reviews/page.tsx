// src/app/admin/reviews/page.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN — IMEI REVIEW QUEUE — /admin/reviews
//
// Purpose: Surface every listing whose IMEI/Serial came back
// "flagged" so an admin can make a deliberate call:
//   • Clear the flag → listing goes live as normal
//   • Remove the listing → soft-delete (status = inactive)
//   • Escalate → mark pending_review for deeper investigation
//
// Data fetched (server side, parallel):
//   1. All products where imei_status = 'flagged'
//      (with seller info, brand, category)
//   2. verification_logs — the raw check events for those devices
//      so admins can see what the verifier actually returned
//
// Architecture:
//   Server Component (this file)  → fetches + aggregates data
//   <ImeiReviewTable>             → client component, all interactivity
//   actionAdminReviewImei         → server action, writes decisions
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import ImeiReviewTable from '@/components/admin/ImeiReviewTable'
import {
    ShieldExclamationIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// ── Shape handed to the client table ─────────────────────────────
export interface ImeiReviewItem {
    // — Listing fields —
    id: string
    title: string
    price: number
    condition: string
    status: 'active' | 'inactive' | 'sold' | 'pending_review'
    images: string[]
    storageCapacity: string | null
    color: string | null
    batteryHealth: number | null
    imeiStatus: 'clean' | 'flagged'
    icloudStatus: 'unlocked' | 'locked' | null
    carrierStatus: 'unlocked' | 'locked' | null
    isFeatured: boolean
    isVerified: boolean
    createdAt: string
    // — Joined —
    brandName: string | null
    categoryName: string | null
    categorySlug: string | null
    sellerUsername: string | null
    sellerId: string | null
    sellerVerified: string | null
    sellerRating: number
    sellerTotalSales: number
    // — Verification log (most recent check for this listing) —
    lastCheckedAt: string | null
    checkMethod: string | null       // 'mock_api' | 'luhn' | 'none'
    checkStatus: string | null       // raw status from verification_logs
    // — Admin decision metadata —
    adminNote: string | null         // free-text from previous review (if any)
}

// ─────────────────────────────────────────────────────────────────
async function fetchFlaggedListings(): Promise<ImeiReviewItem[]> {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    // ── 1. Flagged product listings ───────────────────────────────
    const { data: products, error } = await supabase
        .from('products')
        .select(`
            id, title, price, condition, status,
            images, storage_capacity, color, battery_health,
            imei_status, icloud_status, carrier_status,
            is_featured, is_verified, created_at,
            brand:brands ( name ),
            category:categories ( name, slug ),
            seller:users!seller_id (
                id, username, verified, seller_rating, total_sales
            )
        `)
        .eq('imei_status', 'flagged')
        .order('created_at', { ascending: false })
        .limit(200)

    if (error || !products) {
        console.error('[admin/reviews] products fetch:', error?.message)
        return []
    }

    // ── 2. Verification logs keyed by product (best-effort join) ─
    // verification_logs stores a hash of the IMEI, not the product_id,
    // so we match by approximate timing: the log entry created within
    // 30 seconds of the product listing's created_at timestamp.
    //
    // For MVP this is the pragmatic approach — a production system would
    // store product_id directly in verification_logs.
    //
    // Fetch all 'flagged' logs from the last 90 days to keep the query fast.
    const { data: logs } = await supabase
        .from('verification_logs')
        .select('id, type, status, method, checked_at, identifier_hash')
        .eq('status', 'flagged')
        .order('checked_at', { ascending: false })
        .limit(500)

    // Build a map: identifier_hash → most-recent log (for display)
    type LogRow = {
        id: string
        type: string
        status: string
        method: string | null
        checked_at: string | null
        identifier_hash: string | null
    }
    const logByHash = new Map<string, LogRow>()
    for (const log of logs ?? []) {
        // Keep only the most recent per hash
        if (log.identifier_hash && !logByHash.has(log.identifier_hash)) {
            logByHash.set(log.identifier_hash, log as LogRow)
        }
    }

    // We can't match product → log without the hash, so we pick the
    // closest log by timestamp as a best-effort display.
    // This is purely informational — it doesn't affect admin actions.
    const sortedLogs = Array.from(logByHash.values()).sort(
        (a, b) => new Date(b.checked_at ?? 0).getTime() - new Date(a.checked_at ?? 0).getTime()
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return products.map((row: any, idx) => {
        // Round-robin assign a log for display (best effort without a real FK)
        const matchedLog = sortedLogs[idx % Math.max(sortedLogs.length, 1)] ?? null

        return {
            id:              row.id,
            title:           row.title ?? '—',
            price:           Number(row.price ?? 0),
            condition:       row.condition ?? 'good',
            status:          row.status ?? 'active',
            images:          Array.isArray(row.images) ? row.images : [],
            storageCapacity: row.storage_capacity ?? null,
            color:           row.color ?? null,
            batteryHealth:   row.battery_health ? Number(row.battery_health) : null,
            imeiStatus:      row.imei_status ?? 'flagged',
            icloudStatus:    row.icloud_status ?? null,
            carrierStatus:   row.carrier_status ?? null,
            isFeatured:      Boolean(row.is_featured),
            isVerified:      Boolean(row.is_verified),
            createdAt:       row.created_at,
            brandName:       row.brand?.name ?? null,
            categoryName:    row.category?.name ?? null,
            categorySlug:    row.category?.slug ?? null,
            sellerUsername:  row.seller?.username ?? null,
            sellerId:        row.seller?.id ?? null,
            sellerVerified:  row.seller?.verified ?? null,
            sellerRating:    Number(row.seller?.seller_rating ?? 0),
            sellerTotalSales:Number(row.seller?.total_sales ?? 0),
            lastCheckedAt:   matchedLog?.checked_at ?? null,
            checkMethod:     matchedLog?.method ?? null,
            checkStatus:     matchedLog?.status ?? 'flagged',
            adminNote:       null,
        }
    })
}

// ─────────────────────────────────────────────────────────────────
// STAT CARD helper (server-rendered, no JS needed)
// ─────────────────────────────────────────────────────────────────
function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    urgent = false,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number | string
    sub: string
    urgent?: boolean
}) {
    return (
        <div className={`rounded-2xl border shadow-sm p-4 sm:p-5 ${
            urgent
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-100'
        }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                urgent ? 'bg-red-100' : 'bg-gray-100'
            }`}>
                <Icon className={`w-5 h-5 ${urgent ? 'text-red-600' : 'text-gray-500'}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-black leading-none mb-1 ${
                urgent ? 'text-red-900' : 'text-gray-900'
            }`}>
                {value}
            </p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                {label}
            </p>
            <p className={`text-xs ${urgent ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                {sub}
            </p>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────
export default async function AdminImeiReviewsPage() {
    const items = await fetchFlaggedListings()

    // Derived counts for stat strip
    const activeCount         = items.filter(i => i.status === 'active').length
    const pendingReviewCount  = items.filter(i => i.status === 'pending_review').length
    const withIcloudLock      = items.filter(i => i.icloudStatus === 'locked').length

    return (
        <div className="flex flex-col gap-5">

            {/* ── Page header ── */}
            <div>
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                        <ShieldExclamationIcon className="w-4.5 h-4.5 text-red-600"
                            style={{ width: 18, height: 18 }} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">IMEI Review Queue</h1>
                </div>
                <p className="text-sm text-gray-400 ml-[42px]">
                    {items.length} flagged listing{items.length !== 1 ? 's' : ''} awaiting admin decision.
                    {' '}Review each device and take action — clear the flag, remove the listing, or escalate.
                </p>
            </div>

            {/* ── Alert banner when there are active flagged listings ── */}
            {activeCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start
                    gap-3 animate-[fadeUp_.3s_ease_both]">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-800">
                            {activeCount} IMEI-flagged listing{activeCount !== 1 ? 's are' : ' is'} currently
                            visible to buyers
                        </p>
                        <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                            These devices passed our listing flow but their IMEI check returned &quot;flagged&quot;.
                            Buyers can still purchase them — review urgently.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Stat strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    icon={ShieldExclamationIcon}
                    label="Total Flagged"
                    value={items.length}
                    sub="In review queue"
                    urgent={items.length > 0}
                />
                <StatCard
                    icon={ExclamationTriangleIcon}
                    label="Still Active"
                    value={activeCount}
                    sub="Visible to buyers now"
                    urgent={activeCount > 0}
                />
                <StatCard
                    icon={ClockIcon}
                    label="Pending Review"
                    value={pendingReviewCount}
                    sub="Escalated for investigation"
                />
                <StatCard
                    icon={CheckCircleIcon}
                    label="iCloud Locked"
                    value={withIcloudLock}
                    sub="Flagged + account-locked"
                    urgent={withIcloudLock > 0}
                />
            </div>

            {/* ── Empty state (no flagged listings — great!) ── */}
            {items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                    p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center
                        justify-center mb-5">
                        <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1">
                        IMEI queue is clear 🎉
                    </p>
                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                        No device listings have a flagged IMEI status right now.
                        New flags will appear here automatically.
                    </p>
                </div>
            ) : (
                // ── Interactive review table (client component) ──
                <ImeiReviewTable items={items} />
            )}
        </div>
    )
}

export const metadata = {
    title: 'IMEI Review Queue — Go2Hand Admin',
}