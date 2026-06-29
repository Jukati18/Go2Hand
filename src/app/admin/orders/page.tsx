// src/app/admin/orders/page.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN — ORDER MANAGEMENT — /admin/orders
//
// Server Component: fetches all orders with buyer, seller, and
// device info. Passes data to <OrdersTable> (client) for
// interactive filtering, searching, and admin actions.
//
// Data fetched per order:
//   • Order metadata: status, amounts, timestamps, Stripe PI ID
//   • Buyer: username, id
//   • Seller: username, id
//   • Device: title, images (for thumbnail), product id
//   • Shipping: tracking number, provider, dispute reason
//
// Stat cards computed server-side:
//   • Total orders, active escrow, disputed, platform revenue
// ─────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import OrdersTable from '@/components/admin/OrdersTable'
import {
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    ClockIcon,
    CheckCircleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline'

// ── Shape passed to the client table ─────────────────────────────
export interface AdminOrder {
    id: string
    status: string
    amount: number
    shippingFee: number
    platformFee: number
    total: number
    stripePaymentIntentId: string | null
    createdAt: string
    updatedAt: string | null
    // Timestamps
    paidAt: string | null
    shippedAt: string | null
    inspectionStartedAt: string | null
    completedAt: string | null
    refundedAt: string | null
    cancelledAt: string | null
    // Shipping
    trackingNumber: string | null
    shippingProvider: string | null
    // Dispute
    disputeReason: string | null
    // Relations
    buyerId: string | null
    buyerUsername: string | null
    sellerId: string | null
    sellerUsername: string | null
    deviceId: string | null
    deviceTitle: string | null
    deviceImages: string[]
}

async function fetchAllOrders(): Promise<AdminOrder[]> {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data, error } = await supabase
        .from('orders')
        .select(`
            id, status, amount, shipping_fee, platform_fee, total,
            stripe_payment_intent_id,
            created_at, updated_at,
            paid_at, shipped_at, inspection_started_at,
            completed_at, refunded_at, cancelled_at,
            tracking_number, shipping_provider, dispute_reason,
            buyer_id, seller_id, product_id,
            buyer:users!buyer_id ( id, username ),
            seller:users!seller_id ( id, username ),
            product:products ( id, title, images )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)

    if (error || !data) {
        console.error('[admin/orders] fetch error:', error?.message)
        return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
        id:                    row.id,
        status:                row.status ?? 'pending',
        amount:                Number(row.amount ?? 0),
        shippingFee:           Number(row.shipping_fee ?? 0),
        platformFee:           Number(row.platform_fee ?? 0),
        total:                 Number(row.total ?? row.amount ?? 0),
        stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
        createdAt:             row.created_at,
        updatedAt:             row.updated_at ?? null,
        paidAt:                row.paid_at ?? null,
        shippedAt:             row.shipped_at ?? null,
        inspectionStartedAt:   row.inspection_started_at ?? null,
        completedAt:           row.completed_at ?? null,
        refundedAt:            row.refunded_at ?? null,
        cancelledAt:           row.cancelled_at ?? null,
        trackingNumber:        row.tracking_number ?? null,
        shippingProvider:      row.shipping_provider ?? null,
        disputeReason:         row.dispute_reason ?? null,
        buyerId:               row.buyer?.id ?? null,
        buyerUsername:         row.buyer?.username ?? null,
        sellerId:              row.seller?.id ?? null,
        sellerUsername:        row.seller?.username ?? null,
        deviceId:              row.product?.id ?? null,
        deviceTitle:           row.product?.title ?? null,
        deviceImages:          Array.isArray(row.product?.images) ? row.product.images : [],
    }))
}

// ── Stat card component (server-rendered) ─────────────────────────
function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    urgent = false,
    accent = 'gray',
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string | number
    sub: string
    urgent?: boolean
    accent?: 'gray' | 'teal' | 'red' | 'amber' | 'emerald' | 'blue'
}) {
    const accentMap = {
        gray:    { bg: 'bg-white border-gray-100',       icon: 'bg-gray-100',    iconColor: 'text-gray-500'   },
        teal:    { bg: 'bg-white border-gray-100',       icon: 'bg-teal-50',     iconColor: 'text-teal-600'   },
        red:     { bg: 'bg-red-50 border-red-200',       icon: 'bg-red-100',     iconColor: 'text-red-600'    },
        amber:   { bg: 'bg-amber-50 border-amber-200',   icon: 'bg-amber-100',   iconColor: 'text-amber-600'  },
        emerald: { bg: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        blue:    { bg: 'bg-blue-50 border-blue-100',     icon: 'bg-blue-100',    iconColor: 'text-blue-600'   },
    }
    const c = accentMap[accent]

    return (
        <div className={`rounded-2xl border shadow-sm p-4 sm:p-5 ${c.bg}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.icon}`}>
                <Icon className={`w-5 h-5 ${c.iconColor}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-black leading-none mb-1 ${
                urgent ? 'text-red-900' : 'text-gray-900'
            }`}>
                {value}
            </p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                {label}
            </p>
            <p className={`text-xs ${urgent ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                {sub}
            </p>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────
export default async function AdminOrdersPage() {
    const orders = await fetchAllOrders()

    // Compute stat card values
    const disputed      = orders.filter(o => o.status === 'disputed').length
    const inEscrow      = orders.filter(o => ['paid', 'shipped', 'in_inspection'].includes(o.status)).length
    const completed     = orders.filter(o => o.status === 'completed').length
    const totalRevenue  = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.platformFee, 0)
    const activeGMV     = orders
        .filter(o => ['paid', 'shipped', 'in_inspection'].includes(o.status))
        .reduce((sum, o) => sum + o.total, 0)
    const refunded      = orders.filter(o => o.status === 'refunded').length

    function fmtUSD(n: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', minimumFractionDigits: 0,
        }).format(n)
    }

    return (
        <div className="flex flex-col gap-5">

            {/* ── Page header ── */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    {orders.length.toLocaleString()} total orders — monitor escrow status,
                    resolve disputes, and intervene on stuck transactions.
                </p>
            </div>

            {/* ── Disputed orders alert banner ── */}
            {disputed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start
                    gap-3 animate-[fadeUp_.3s_ease_both]">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-900">
                            {disputed} order{disputed !== 1 ? 's' : ''} under dispute — action required
                        </p>
                        <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                            Disputed orders should be reviewed within 24 hours.
                            Use the "Disputed" tab to filter to these orders, then
                            Force Complete or Force Refund based on your investigation.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatCard
                    icon={ShieldCheckIcon}
                    label="Total Orders"
                    value={orders.length.toLocaleString()}
                    sub="All time"
                    accent="teal"
                />
                <StatCard
                    icon={ClockIcon}
                    label="Active Escrow"
                    value={inEscrow}
                    sub={`${fmtUSD(activeGMV)} held`}
                    accent={inEscrow > 0 ? 'amber' : 'gray'}
                    urgent={false}
                />
                <StatCard
                    icon={ExclamationTriangleIcon}
                    label="Disputed"
                    value={disputed}
                    sub="Need resolution"
                    accent={disputed > 0 ? 'red' : 'gray'}
                    urgent={disputed > 0}
                />
                <StatCard
                    icon={CheckCircleIcon}
                    label="Completed"
                    value={completed}
                    sub="Successfully closed"
                    accent="emerald"
                />
                <StatCard
                    icon={CurrencyDollarIcon}
                    label="Platform Revenue"
                    value={fmtUSD(totalRevenue)}
                    sub="5% on completed"
                    accent="teal"
                />
                <StatCard
                    icon={ArrowPathIcon}
                    label="Refunded"
                    value={refunded}
                    sub="Buyer-side resolutions"
                    accent="blue"
                />
            </div>

            {/* ── Interactive table ── */}
            <OrdersTable orders={orders} />
        </div>
    )
}

export const metadata = {
    title: 'Order Management — Go2Hand Admin',
}