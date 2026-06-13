'use client'
// src/components/orders/OrderConfirmationClient.tsx
// ─────────────────────────────────────────────────────────────────
// Main client shell for the order confirmation page.
//
// Responsibilities:
//   • Shows animated success burst on mount (buyer only, fresh orders)
//   • Auto-refreshes order data every 30s to catch webhook upgrades
//   • Renders: device card, price breakdown, countdown, next steps,
//              seller/buyer card, action buttons, escrow timeline
//   • Adapts layout and content based on role + status
//
// Layout (mobile-first):
//   Single column on mobile
//   Two-column grid on lg: main [1fr] | sidebar [380px]
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    ChevronRightIcon,
    HomeIcon,
    ShieldCheckIcon,
    TruckIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import type { Order, OrderStatus } from '@/types/order'
import { getOrderById, formatOrderAmount, getInspectionDaysRemaining } from '@/services/orderService'
import { actionMarkShipped, actionMarkReceived, actionCompleteOrder, actionDisputeOrder } from '@/actions/order'
import { STATUS_LABELS, STATUS_PILL_STYLES } from '@/components/orders/OrderStatusTracker'
import ConfirmationSuccessBurst from './ConfirmationSuccessBurst'
import InspectionCountdown from './InspectionCountdown'
import ConfirmationNextSteps from './ConfirmationNextSteps'

// ── "Fresh" order threshold — show burst for orders < 5 min old ───
const FRESH_THRESHOLD_MS = 5 * 60 * 1000

function isRecentOrder(createdAt: string): boolean {
    return Date.now() - new Date(createdAt).getTime() < FRESH_THRESHOLD_MS
}

// ── Toast ──────────────────────────────────────────────────────────
interface ToastState { msg: string; type: 'ok' | 'err' }

// ── Price row helper ───────────────────────────────────────────────
function PriceLine({
    label,
    value,
    muted = false,
    green = false,
    bold = false,
}: {
    label: string
    value: string
    muted?: boolean
    green?: boolean
    bold?: boolean
}) {
    return (
        <div className="flex items-center justify-between">
            <span className={`text-sm ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
            <span className={`text-sm
                ${bold   ? 'font-bold text-gray-900' : ''}
                ${green  ? 'font-semibold text-emerald-600' : ''}
                ${muted  ? 'text-gray-400' : 'text-gray-800 font-medium'}
            `}>
                {value}
            </span>
        </div>
    )
}

// ── Main component ─────────────────────────────────────────────────
interface OrderConfirmationClientProps {
    order: Order
    role: 'buyer' | 'seller'
    userId: string
}

export default function OrderConfirmationClient({
    order: initialOrder,
    role,
    userId,
}: OrderConfirmationClientProps) {
    const router = useRouter()
    const [order, setOrder] = useState<Order>(initialOrder)
    const [toast, setToast] = useState<ToastState | null>(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    // Determine if this is a "fresh" order for the success burst
    const showBurst = role === 'buyer' && isRecentOrder(order.createdAt)

    const product = order.product
    const otherParty = role === 'buyer' ? order.seller : order.buyer

    // ── Auto-refresh every 30s to pick up webhook status changes ──
    const refresh = useCallback(async () => {
        const updated = await getOrderById(order.id)
        if (updated) setOrder(updated)
    }, [order.id])

    useEffect(() => {
        // Only poll for non-terminal statuses
        if (['completed', 'cancelled', 'refunded', 'disputed'].includes(order.status)) return
        const interval = setInterval(refresh, 30_000)
        return () => clearInterval(interval)
    }, [order.status, refresh])

    // ── Toast helper ───────────────────────────────────────────────
    function showToast(msg: string, type: ToastState['type'] = 'ok') {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    // ── Copy order ID ──────────────────────────────────────────────
    async function copyOrderId() {
        await navigator.clipboard.writeText(order.id)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // ── Action handlers ────────────────────────────────────────────
    async function handleMarkShipped() {
        // Route to order detail page where the ship modal lives
        router.push(`/orders/${order.id}`)
    }

    async function handleMarkReceived() {
        setLoading(true)
        const result = await actionMarkReceived(order.id)
        setLoading(false)
        if (result.success) {
            showToast('Inspection window started! You have 5 days to review.')
            await refresh()
        } else {
            showToast(result.error ?? 'Something went wrong', 'err')
        }
    }

    async function handleComplete() {
        setLoading(true)
        const result = await actionCompleteOrder(order.id)
        setLoading(false)
        if (result.success) {
            showToast('Payment released! Thank you for your purchase.')
            await refresh()
        } else {
            showToast(result.error ?? 'Something went wrong', 'err')
        }
    }

    async function handleDispute() {
        // Route to order detail for the full dispute modal
        router.push(`/orders/${order.id}`)
    }

    // ── Status-dependent action buttons ───────────────────────────
    const ActionButtons = () => {
        if (role === 'seller' && order.status === 'paid') {
            return (
                <button
                    onClick={handleMarkShipped}
                    className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-bold
                        rounded-xl text-sm flex items-center justify-center gap-2
                        transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                    <TruckIcon className="w-4 h-4" />
                    Mark as Shipped
                </button>
            )
        }

        if (role === 'buyer' && order.status === 'shipped') {
            return (
                <button
                    onClick={handleMarkReceived}
                    disabled={loading}
                    className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-bold
                        rounded-xl text-sm flex items-center justify-center gap-2
                        transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    {loading ? 'Updating…' : 'I Received the Device'}
                </button>
            )
        }

        if (role === 'buyer' && order.status === 'in_inspection') {
            return (
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleComplete}
                        disabled={loading}
                        className="w-full h-12 bg-teal-800 hover:bg-teal-700 text-white font-bold
                            rounded-xl text-sm flex items-center justify-center gap-2
                            transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                    >
                        <CheckSolid className="w-4 h-4" />
                        {loading ? 'Processing…' : 'Approve & Release Payment'}
                    </button>
                    <button
                        onClick={handleDispute}
                        disabled={loading}
                        className="w-full h-11 border-2 border-red-200 text-red-600 font-semibold
                            rounded-xl text-sm flex items-center justify-center gap-2
                            hover:bg-red-50 transition-colors"
                    >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Raise a Dispute
                    </button>
                </div>
            )
        }

        return null
    }

    return (
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

            {/* ── Success burst (buyer, fresh orders only) ── */}
            <ConfirmationSuccessBurst active={showBurst} />

            {/* ── Breadcrumb ── */}
            <nav className="flex items-center gap-1.5 mb-5 text-[12px] text-gray-400 flex-wrap">
                <Link href="/" aria-label="Home">
                    <HomeIcon className="w-3.5 h-3.5 hover:text-teal-700 transition-colors" />
                </Link>
                <ChevronRightIcon className="w-3 h-3" />
                <Link href="/dashboard/orders"
                    className="hover:text-teal-700 transition-colors">
                    My Orders
                </Link>
                <ChevronRightIcon className="w-3 h-3" />
                <span className="text-gray-600 font-medium">Order Confirmation</span>
            </nav>

            {/* ── Page header ── */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {role === 'buyer'
                                ? (showBurst ? 'Order Confirmed!' : 'Order Details')
                                : 'Sale Confirmed!'
                            }
                        </h1>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full
                            ${STATUS_PILL_STYLES[order.status as OrderStatus]}`}>
                            {STATUS_LABELS[order.status as OrderStatus]}
                        </span>
                    </div>

                    {/* Order ID with copy button */}
                    <button
                        onClick={copyOrderId}
                        className="flex items-center gap-1.5 text-[12px] text-gray-400
                            hover:text-teal-700 transition-colors group"
                    >
                        <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                        {copied
                            ? <CheckSolid className="w-3 h-3 text-teal-600" />
                            : <ClipboardDocumentIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        }
                        {copied && <span className="text-teal-600 font-medium">Copied!</span>}
                    </button>
                </div>

                {/* View full order detail link */}
                <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-500
                        hover:text-teal-700 transition-colors border border-gray-200
                        hover:border-teal-300 px-4 py-2 rounded-xl"
                >
                    Full order detail
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* ── MAIN GRID ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 sm:gap-6 items-start">

                {/* ════ LEFT COLUMN ════ */}
                <div className="flex flex-col gap-4 sm:gap-5">

                    {/* ── Inspection Countdown (only when in_inspection) ── */}
                    {order.status === 'in_inspection' && order.inspectionStartedAt && (
                        <InspectionCountdown
                            inspectionStartedAt={order.inspectionStartedAt}
                            className="animate-[fadeUp_.4s_ease_both]"
                        />
                    )}

                    {/* ── Inspection countdown for paid/shipped states with note ── */}
                    {order.status === 'paid' && role === 'buyer' && (
                        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 sm:p-5
                            flex items-start gap-3 animate-[fadeUp_.4s_ease_both]">
                            <ShieldCheckIcon className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-teal-900 mb-0.5">
                                    Payment secured in escrow
                                </p>
                                <p className="text-xs text-teal-700 leading-relaxed">
                                    Your {formatOrderAmount(order.total)} is safely held.
                                    It will only be released to the seller after you approve the device.
                                    Your 5-day inspection window starts when you confirm delivery.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── What Happens Next ── */}
                    <ConfirmationNextSteps
                        status={order.status}
                        role={role}
                        orderId={order.id}
                        className="animate-[fadeUp_.45s_ease_both]"
                    />

                    {/* ── Action buttons ── */}
                    {ActionButtons() && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                            animate-[fadeUp_.5s_ease_both]">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">
                                Action Required
                            </h3>
                            <ActionButtons />
                        </div>
                    )}

                    {/* ── Tracking info (when shipped) ── */}
                    {order.trackingNumber && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                            flex items-center gap-4 animate-[fadeUp_.5s_ease_both]">
                            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center
                                justify-center shrink-0">
                                <TruckIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                    Tracking Info
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                    {order.shippingProvider ?? 'Carrier'}
                                </p>
                                <p className="text-sm font-mono text-gray-600 mt-0.5">
                                    {order.trackingNumber}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Shipping address (buyer only) ── */}
                    {role === 'buyer' && order.shippingAddress && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                            animate-[fadeUp_.55s_ease_both]">
                            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <TruckIcon className="w-4 h-4 text-gray-400" />
                                Shipping To
                            </h3>
                            <div className="text-sm text-gray-600 leading-relaxed space-y-0.5">
                                <p className="font-semibold text-gray-800">
                                    {order.shippingAddress.fullName}
                                </p>
                                <p>{order.shippingAddress.addressLine1}</p>
                                {order.shippingAddress.addressLine2 && (
                                    <p>{order.shippingAddress.addressLine2}</p>
                                )}
                                <p>
                                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                                    {order.shippingAddress.postalCode}
                                </p>
                                <p className="text-gray-400">{order.shippingAddress.phone}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ════ RIGHT SIDEBAR ════ */}
                <div className="flex flex-col gap-4 lg:sticky lg:top-[78px]">

                    {/* ── Device card ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                        animate-[fadeUp_.35s_ease_both]">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900">Device</h3>
                        </div>

                        {product ? (
                            <div className="p-4 flex gap-4">
                                {/* Thumbnail */}
                                <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100
                                    flex items-center justify-center shrink-0 overflow-hidden">
                                    {product.images?.[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.title}
                                            width={80}
                                            height={80}
                                            className="w-full h-full object-contain p-1"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-3xl select-none">📱</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {product.brand && (
                                        <p className="text-[11px] font-bold text-teal-600 uppercase
                                            tracking-widest mb-0.5">
                                            {product.brand}
                                        </p>
                                    )}
                                    <p className="text-sm font-semibold text-gray-900 leading-snug
                                        line-clamp-2 mb-2">
                                        {product.title}
                                    </p>
                                    <Link
                                        href={`/devices/${product.id}`}
                                        className="text-xs text-teal-600 hover:text-teal-800
                                            transition-colors font-medium"
                                    >
                                        View listing →
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-sm text-gray-400">Device info unavailable</div>
                        )}
                    </div>

                    {/* ── Price breakdown ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                        animate-[fadeUp_.4s_ease_both]">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900">
                                {role === 'buyer' ? 'Payment Summary' : 'Earnings Summary'}
                            </h3>
                        </div>
                        <div className="px-5 py-4 flex flex-col gap-2.5">
                            <PriceLine
                                label="Device price"
                                value={formatOrderAmount(order.amount)}
                            />
                            <PriceLine
                                label="Shipping"
                                value={order.shippingFee === 0 ? 'Free' : formatOrderAmount(order.shippingFee)}
                                green={order.shippingFee === 0}
                            />
                            {role === 'seller' && (
                                <PriceLine
                                    label="Platform fee (5%)"
                                    value={`-${formatOrderAmount(order.platformFee)}`}
                                    muted
                                />
                            )}

                            <div className="border-t border-gray-100 pt-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900">
                                        {role === 'buyer' ? 'Total charged' : 'Your payout'}
                                    </span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {formatOrderAmount(
                                            role === 'buyer'
                                                ? order.total
                                                : order.amount - order.platformFee
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Escrow hold notice */}
                            {['paid', 'shipped', 'in_inspection'].includes(order.status) && (
                                <div className="mt-1 bg-emerald-50 border border-emerald-100
                                    rounded-xl px-3 py-2.5">
                                    <p className="text-xs text-emerald-700 leading-relaxed">
                                        {role === 'buyer'
                                            ? '🔒 Held in escrow — released when you approve the device.'
                                            : '🔒 Funds held in escrow until buyer approves.'
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Completed payout notice */}
                            {order.status === 'completed' && role === 'seller' && (
                                <div className="mt-1 bg-teal-50 border border-teal-100
                                    rounded-xl px-3 py-2.5 flex items-center gap-2">
                                    <CheckSolid className="w-4 h-4 text-teal-600 shrink-0" />
                                    <p className="text-xs text-teal-700 font-semibold">
                                        Payment released! Expect payout in 1–3 business days.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Other party card ── */}
                    {otherParty && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                            animate-[fadeUp_.45s_ease_both]">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                {role === 'buyer' ? 'Seller' : 'Buyer'}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br
                                    from-teal-500 to-emerald-400 flex items-center justify-center
                                    text-white text-sm font-bold shrink-0">
                                    {otherParty.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {otherParty.username}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Go2Hand member
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Quick links ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5
                        animate-[fadeUp_.5s_ease_both]">
                        <div className="flex flex-col gap-1">
                            {[
                                { label: 'View Full Order Detail', href: `/orders/${order.id}` },
                                { label: 'All My Orders', href: '/dashboard/orders' },
                                { label: 'Continue Browsing', href: '/devices' },
                            ].map(({ label, href }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="flex items-center justify-between px-3 py-2.5
                                        rounded-xl hover:bg-gray-50 text-sm text-gray-600
                                        hover:text-teal-700 font-medium transition-colors group"
                                >
                                    {label}
                                    <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300
                                        group-hover:text-teal-500 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── Trust badges ── */}
                    <div className="flex flex-col gap-2">
                        {[
                            { icon: ShieldCheckIcon, text: 'Escrow protected throughout' },
                            { icon: ArrowPathIcon,   text: '30-day hassle-free returns' },
                            { icon: CheckCircleIcon, text: 'IMEI verified device' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text}
                                className="flex items-center gap-2 text-xs text-gray-500">
                                <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Toast ── */}
            {toast && (
                <div className={`
                    fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-2xl
                    flex items-center gap-3 text-sm font-medium
                    animate-[fadeUp_.3s_ease_both]
                    ${toast.type === 'ok' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}
                `}>
                    {toast.type === 'ok'
                        ? <CheckSolid className="w-5 h-5 text-emerald-400 shrink-0" />
                        : <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                    }
                    {toast.msg}
                </div>
            )}
        </div>
    )
}