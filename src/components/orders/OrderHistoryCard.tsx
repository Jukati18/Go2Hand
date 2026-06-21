// src/components/orders/OrderHistoryCard.tsx
// ─────────────────────────────────────────────────────────────────
// ORDER HISTORY CARD
//
// A rich, self-contained card for a single order.
// Used on /dashboard/orders to display order history with escrow
// status inline — buyers and sellers each see context-appropriate
// information and action buttons.
//
// Features:
//   • Device thumbnail + brand + title
//   • EscrowTimelineMini — inline 4-step progress bar
//   • Inspection countdown (days remaining, urgent if ≤ 1)
//   • Tracking number chip (when shipped)
//   • Role-aware price display (buyer = total paid, seller = payout)
//   • Primary action CTA that adapts to current status + role
//   • Hover state with card lift effect
//   • Stagger animation via animationDelay prop
// ─────────────────────────────────────────────────────────────────

'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
    ClockIcon,
    TruckIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    TagIcon,
} from '@heroicons/react/24/outline'
import EscrowTimelineMini from '@/components/orders/EscrowTimelineMini'
import { STATUS_LABELS, STATUS_PILL_STYLES } from '@/components/orders/OrderStatusTracker'
import { formatOrderAmount, getInspectionDaysRemaining } from '@/services/orderService'
import type { Order, OrderStatus } from '@/types/order'

// ── Role-aware action button config ──────────────────────────────
// Each (role, status) pair maps to a CTA label + icon.
// If there's no action for this state, returns null (no button).
function getAction(
    status: OrderStatus,
    role: 'buyer' | 'seller'
): { label: string; icon: React.ComponentType<{ className?: string }>; urgent?: boolean } | null {
    if (role === 'seller') {
        if (status === 'paid')    return { label: 'Mark Shipped',  icon: TruckIcon,         urgent: true  }
    }
    if (role === 'buyer') {
        if (status === 'shipped') return { label: 'Confirm Receipt', icon: CheckCircleIcon, urgent: true  }
        if (status === 'in_inspection') return { label: 'Approve / Dispute', icon: ExclamationTriangleIcon, urgent: true }
    }
    // View detail is always available
    return { label: 'View Details', icon: ArrowRightIcon }
}

interface OrderHistoryCardProps {
    order: Order
    role: 'buyer' | 'seller'
    style?: React.CSSProperties
}

export default function OrderHistoryCard({ order, role, style }: OrderHistoryCardProps) {
    const product       = order.product
    const otherParty    = role === 'buyer' ? order.seller : order.buyer
    const otherLabel    = role === 'buyer' ? 'Seller' : 'Buyer'
    const inspectionDays = getInspectionDaysRemaining(order)
    const action        = getAction(order.status, role)

    // ── Derived display values ────────────────────────────────────
    // Buyer sees total paid; seller sees their payout (amount - platform fee)
    const displayAmount = role === 'buyer'
        ? order.total
        : order.amount - order.platformFee

    // Whether this card needs immediate attention
    const needsAttention =
        (role === 'seller' && order.status === 'paid') ||
        (role === 'buyer'  && ['shipped', 'in_inspection'].includes(order.status))

    // Format order date
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    })

    return (
        <div
            className={`
                group bg-white rounded-2xl border shadow-sm overflow-hidden
                transition-all duration-250 hover:shadow-lg hover:-translate-y-0.5
                animate-[fadeUp_.35s_ease_both]
                ${needsAttention
                    ? 'border-amber-200 hover:border-amber-300'
                    : order.status === 'completed'
                        ? 'border-emerald-100 hover:border-emerald-200'
                        : ['cancelled', 'refunded'].includes(order.status)
                            ? 'border-gray-100 hover:border-gray-200 opacity-75 hover:opacity-100'
                            : 'border-gray-100 hover:border-teal-200'
                }
            `}
            style={style}
        >
            {/* ── Attention banner — shown when action is required ── */}
            {needsAttention && (
                <div className="h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />
            )}
            {order.status === 'completed' && (
                <div className="h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400" />
            )}

            <div className="p-4 sm:p-5">

                {/* ── TOP ROW: thumbnail + info + price ── */}
                <div className="flex items-start gap-3 sm:gap-4 mb-4">

                    {/* Device thumbnail */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-50 border border-gray-100
                        flex items-center justify-center shrink-0 overflow-hidden">
                        {product?.images?.[0] ? (
                            <Image
                                src={product.images[0]}
                                alt={product.title}
                                width={64}
                                height={64}
                                sizes="64px"
                                className="w-full h-full object-contain p-1"
                            />
                        ) : (
                            <span className="text-2xl select-none">📱</span>
                        )}
                    </div>

                    {/* Device info */}
                    <div className="flex-1 min-w-0">
                        {/* Status pill + date */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full
                                ${STATUS_PILL_STYLES[order.status]}`}>
                                {STATUS_LABELS[order.status]}
                            </span>
                            <span className="text-[10px] text-gray-400 hidden sm:inline">
                                #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {orderDate}
                            </span>
                        </div>

                        {/* Brand */}
                        {product?.brand && (
                            <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">
                                {product.brand}
                            </p>
                        )}

                        {/* Title */}
                        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1">
                            {product?.title ?? 'Device'}
                        </p>

                        {/* Other party */}
                        {otherParty && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {otherLabel}: <span className="font-medium text-gray-600">{otherParty.username}</span>
                            </p>
                        )}
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                        <p className="text-base sm:text-lg font-bold text-gray-900 leading-none">
                            {formatOrderAmount(displayAmount)}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {role === 'buyer' ? 'total paid' : 'your payout'}
                        </p>
                    </div>
                </div>

                {/* ── ESCROW TIMELINE MINI ── */}
                {/* Only shown for non-terminal, non-pending states */}
                {!['cancelled', 'refunded', 'disputed', 'pending'].includes(order.status) ? (
                    <div className="mb-4 pb-4 border-b border-gray-50">
                        <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest
                                flex items-center gap-1">
                                <ShieldCheckIcon className="w-3 h-3" />
                                Escrow Progress
                            </span>
                            {/* Inspection countdown pill */}
                            {inspectionDays !== null && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1
                                    ${inspectionDays <= 1
                                        ? 'bg-red-100 text-red-600 animate-pulse'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    <ClockIcon className="w-2.5 h-2.5" />
                                    {inspectionDays === 0
                                        ? 'Expires today'
                                        : `${inspectionDays}d left to inspect`
                                    }
                                </span>
                            )}
                        </div>
                        <EscrowTimelineMini status={order.status} showLabels={true} />
                    </div>
                ) : (
                    /* Terminal state — show simple inline indicator */
                    <div className="mb-4 pb-4 border-b border-gray-50">
                        <EscrowTimelineMini status={order.status} showLabels={false} />
                    </div>
                )}

                {/* ── BOTTOM ROW: tracking + action ── */}
                <div className="flex items-center justify-between gap-3">

                    {/* Left: tracking chip OR contextual info */}
                    <div className="flex items-center gap-2 min-w-0">
                        {order.trackingNumber ? (
                            /* Tracking number chip */
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200
                                rounded-lg px-2.5 py-1.5 min-w-0">
                                <TruckIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider
                                        leading-none mb-0.5">
                                        {order.shippingProvider ?? 'Carrier'}
                                    </p>
                                    <p className="text-[11px] font-mono text-gray-700 truncate max-w-[120px]">
                                        {order.trackingNumber}
                                    </p>
                                </div>
                            </div>
                        ) : order.status === 'paid' && role === 'seller' ? (
                            /* Nudge seller to ship */
                            <div className="flex items-center gap-1.5 text-amber-600">
                                <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs font-semibold">Buyer waiting for shipment</span>
                            </div>
                        ) : order.status === 'completed' ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs font-semibold">Payment released</span>
                            </div>
                        ) : order.status === 'in_inspection' && role === 'buyer' ? (
                            <div className="flex items-center gap-1.5 text-teal-700">
                                <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-xs font-medium">Your funds are held safely</span>
                            </div>
                        ) : (
                            /* Order ID on mobile (hidden on sm+) */
                            <span className="text-[10px] text-gray-400 font-mono sm:hidden">
                                #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* Right: action CTA */}
                    {action && (
                        <Link
                            href={`/orders/${order.id}`}
                            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl
                                transition-all duration-200 shrink-0 whitespace-nowrap
                                hover:-translate-y-0.5 hover:shadow-md
                                ${action.urgent
                                    ? 'bg-teal-800 hover:bg-teal-700 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                        >
                            <action.icon className="w-3.5 h-3.5" />
                            {action.label}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}