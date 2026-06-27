// src/app/admin/reports/page.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN — REPORTS QUEUE — /admin/reports
//
// Shows all user-submitted reports with:
//   • Stat strip: pending / reviewed / dismissed counts
//   • Urgent banner when active-listing reports are pending
//   • <ReportsTable> client component for interactive moderation
//
// Data fetched per report:
//   • Report metadata (reason, details, status, created_at)
//   • Reporter info (username, avatar)
//   • Target info:
//       listing → title, price, images, seller username
//       user    → username, avatar, role, ban status
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import ReportsTable from '@/components/admin/ReportsTable'
import {
    FlagIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

// ── Shape passed to the client table ─────────────────────────────
export interface AdminReport {
    id: string
    targetType: 'listing' | 'user'
    targetId: string
    reason: string
    details: string | null
    status: 'pending' | 'reviewed' | 'dismissed'
    decision: string | null
    adminNote: string | null
    reviewedAt: string | null
    createdAt: string

    // Reporter
    reporterUsername: string | null
    reporterId: string | null

    // Target — listing fields
    listingTitle: string | null
    listingPrice: number | null
    listingImages: string[]
    listingStatus: string | null
    sellerUsername: string | null
    sellerId: string | null

    // Target — user fields
    targetUsername: string | null
    targetRole: string | null
    targetIsBanned: boolean
    targetBanType: string | null
    targetBannedUntil: string | null
}

async function fetchReports(): Promise<AdminReport[]> {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    // Fetch all reports, ordered newest first
    const { data: reports, error } = await supabase
        .from('reports')
        .select(`
            id, target_type, target_id, reason, details,
            status, decision, admin_note, reviewed_at, created_at,
            reporter:users!reporter_id ( id, username )
        `)
        .order('created_at', { ascending: false })
        .limit(500)

    if (error || !reports) {
        console.error('[admin/reports] fetch error:', error?.message)
        return []
    }

    // Separate target IDs by type for batch fetching
    const listingIds = reports
        .filter(r => r.target_type === 'listing')
        .map(r => r.target_id)
    const userIds = reports
        .filter(r => r.target_type === 'user')
        .map(r => r.target_id)

    // Batch fetch listing targets
    const listingMap = new Map<string, {
        title: string; price: number; images: string[]; status: string
        seller: { id: string; username: string } | null
    }>()
    if (listingIds.length > 0) {
        const { data: listings } = await supabase
            .from('products')
            .select(`id, title, price, images, status, seller:users!seller_id(id, username)`)
            .in('id', listingIds)
        for (const l of listings ?? []) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const s = (l as any).seller
            listingMap.set(l.id, {
                title:  l.title ?? '—',
                price:  Number(l.price ?? 0),
                images: Array.isArray(l.images) ? l.images : [],
                status: l.status ?? 'active',
                seller: s ? { id: s.id, username: s.username ?? '—' } : null,
            })
        }
    }

    // Batch fetch user targets
    const userMap = new Map<string, {
        username: string; role: string
        is_banned: boolean; ban_type: string | null; banned_until: string | null
    }>()
    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, username, role, is_banned, ban_type, banned_until')
            .in('id', userIds)
        for (const u of users ?? []) {
            userMap.set(u.id, {
                username:     u.username ?? '—',
                role:         u.role ?? 'buyer',
                is_banned:    Boolean(u.is_banned),
                ban_type:     u.ban_type ?? null,
                banned_until: u.banned_until ?? null,
            })
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return reports.map((r: any) => {
        const listing = r.target_type === 'listing' ? listingMap.get(r.target_id) : null
        const targetUser = r.target_type === 'user' ? userMap.get(r.target_id) : null
        const reporter = r.reporter

        return {
            id:              r.id,
            targetType:      r.target_type,
            targetId:        r.target_id,
            reason:          r.reason ?? 'other',
            details:         r.details ?? null,
            status:          r.status ?? 'pending',
            decision:        r.decision ?? null,
            adminNote:       r.admin_note ?? null,
            reviewedAt:      r.reviewed_at ?? null,
            createdAt:       r.created_at,

            reporterUsername: reporter?.username ?? null,
            reporterId:       reporter?.id ?? null,

            listingTitle:    listing?.title ?? null,
            listingPrice:    listing?.price ?? null,
            listingImages:   listing?.images ?? [],
            listingStatus:   listing?.status ?? null,
            sellerUsername:  listing?.seller?.username ?? null,
            sellerId:        listing?.seller?.id ?? null,

            targetUsername:   targetUser?.username ?? null,
            targetRole:       targetUser?.role ?? null,
            targetIsBanned:   targetUser?.is_banned ?? false,
            targetBanType:    targetUser?.ban_type ?? null,
            targetBannedUntil: targetUser?.banned_until ?? null,
        }
    })
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({
    icon: Icon, label, value, sub, urgent = false,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string; value: number; sub: string; urgent?: boolean
}) {
    return (
        <div className={`rounded-2xl border shadow-sm p-4 sm:p-5 ${
            urgent ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
        }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                urgent ? 'bg-red-100' : 'bg-gray-100'
            }`}>
                <Icon className={`w-5 h-5 ${urgent ? 'text-red-600' : 'text-gray-500'}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-black leading-none mb-1 ${
                urgent ? 'text-red-900' : 'text-gray-900'
            }`}>{value}</p>
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
export default async function AdminReportsPage() {
    const reports = await fetchReports()

    const pendingCount   = reports.filter(r => r.status === 'pending').length
    const reviewedCount  = reports.filter(r => r.status === 'reviewed').length
    const dismissedCount = reports.filter(r => r.status === 'dismissed').length
    const listingReports = reports.filter(r => r.targetType === 'listing' && r.status === 'pending').length
    const userReports    = reports.filter(r => r.targetType === 'user' && r.status === 'pending').length

    return (
        <div className="flex flex-col gap-5">

            {/* Page header */}
            <div>
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                        <FlagIcon className="w-4.5 h-4.5 text-orange-600" style={{ width: 18, height: 18 }} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Content Reports</h1>
                </div>
                <p className="text-sm text-gray-400 ml-[42px]">
                    {reports.length} total reports — review user-submitted flags and take moderation action.
                </p>
            </div>

            {/* Urgent banner */}
            {pendingCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4
                    flex items-start gap-3 animate-[fadeUp_.3s_ease_both]">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-orange-900">
                            {pendingCount} report{pendingCount !== 1 ? 's' : ''} pending review
                        </p>
                        <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">
                            {listingReports > 0 && `${listingReports} listing${listingReports !== 1 ? 's' : ''} flagged. `}
                            {userReports > 0 && `${userReports} user${userReports !== 1 ? 's' : ''} reported. `}
                            Review each report and take appropriate action.
                        </p>
                    </div>
                </div>
            )}

            {/* Stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={FlagIcon}         label="Total Reports"  value={reports.length}  sub="All time"               urgent={false} />
                <StatCard icon={ClockIcon}        label="Pending"        value={pendingCount}    sub="Awaiting admin action"  urgent={pendingCount > 0} />
                <StatCard icon={CheckCircleIcon}  label="Reviewed"       value={reviewedCount}   sub="Action taken"           />
                <StatCard icon={XCircleIcon}      label="Dismissed"      value={dismissedCount}  sub="Not a violation"        />
            </div>

            {/* Empty state */}
            {reports.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm
                    p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center
                        justify-center mb-5">
                        <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 mb-1">No reports yet</p>
                    <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                        User-submitted content reports will appear here when buyers or sellers
                        flag suspicious listings or accounts.
                    </p>
                </div>
            ) : (
                <ReportsTable reports={reports} />
            )}
        </div>
    )
}

export const metadata = {
    title: 'Content Reports — Go2Hand Admin',
}