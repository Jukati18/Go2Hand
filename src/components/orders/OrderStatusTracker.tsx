'use client'

// ============================================
// ORDER STATUS TRACKER
//
// Shows the escrow lifecycle as a visual
// step tracker. Adapts to buyer vs seller view,
// showing the correct action buttons for each.
//
// Usage:
//   <OrderStatusTracker
//     order={order}
//     role="buyer"
//     onAction={() => router.refresh()}
//   />
// ============================================

import { useState } from 'react'
import {
    ShieldCheckIcon,
    TruckIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import type { Order, OrderStatus } from '@/types/order'
import { getInspectionDaysRemaining } from '@/services/orderService'
import {
    actionMarkShipped,
    actionMarkReceived,
    actionCompleteOrder,
    actionDisputeOrder,
    actionCancelOrder,
} from '@/actions/order'

// ── Each step in the escrow timeline ─────────────────────────────
interface EscrowStep {
    status: OrderStatus
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    // Which timestamp to show under this step
    timestampKey: keyof Pick<Order,
        'paidAt' | 'shippedAt' | 'inspectionStartedAt' | 'completedAt'
    >
}

const ESCROW_STEPS: EscrowStep[] = [
    {
        status: 'paid',
        label: 'Payment Secured',
        description: 'Money held safely in escrow',
        icon: ShieldCheckIcon,
        timestampKey: 'paidAt',
    },
    {
        status: 'shipped',
        label: 'Device Shipped',
        description: 'Seller dispatched the device',
        icon: TruckIcon,
        timestampKey: 'shippedAt',
    },
    {
        status: 'in_inspection',
        label: 'In Inspection',
        description: '5-day buyer inspection window',
        icon: ClockIcon,
        timestampKey: 'inspectionStartedAt',
    },
    {
        status: 'completed',
        label: 'Completed',
        description: 'Payment released to seller',
        icon: CheckCircleIcon,
        timestampKey: 'completedAt',
    },
]

// ── Step order for calculating progress ───────────────────────────
const STATUS_ORDER: OrderStatus[] = [
    'pending', 'paid', 'shipped', 'in_inspection', 'completed',
]

function getStepIndex(status: OrderStatus): number {
    return STATUS_ORDER.indexOf(status)
}

// ── Format ISO timestamp to readable string ───────────────────────
function formatTimestamp(iso: string | null): string {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
}

// ── Props ─────────────────────────────────────────────────────────
interface OrderStatusTrackerProps {
    order: Order
    role: 'buyer' | 'seller'
    /** Called after a successful action so parent can refresh data */
    onAction?: () => void
}

export default function OrderStatusTracker({ order, role, onAction }: OrderStatusTrackerProps) {
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

    // Dispute modal state
    const [showDisputeModal, setShowDisputeModal] = useState(false)
    const [disputeReason, setDisputeReason] = useState('')

    // Ship modal state
    const [showShipModal, setShowShipModal] = useState(false)
    const [trackingNumber, setTrackingNumber] = useState('')
    const [shippingProvider, setShippingProvider] = useState('J&T Express')

    const inspectionDays = getInspectionDaysRemaining(order)
    const isTerminal = ['completed', 'refunded', 'cancelled', 'disputed'].includes(order.status)

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    // ── Action handlers ───────────────────────────────────────────
    async function handleMarkShipped() {
        setLoading(true)
        const result = await actionMarkShipped(order.id, trackingNumber, shippingProvider)
        setLoading(false)
        if (result.success) {
            showToast('Shipment confirmed! Buyer has been notified.')
            setShowShipModal(false)
            onAction?.()
        } else {
            showToast(result.error ?? 'Something went wrong', 'error')
        }
    }

    async function handleMarkReceived() {
        setLoading(true)
        const result = await actionMarkReceived(order.id)
        setLoading(false)
        if (result.success) {
            showToast('Inspection period started. You have 5 days to approve or dispute.')
            onAction?.()
        } else {
            showToast(result.error ?? 'Something went wrong', 'error')
        }
    }

    async function handleComplete() {
        setLoading(true)
        const result = await actionCompleteOrder(order.id)
        setLoading(false)
        if (result.success) {
            showToast('Payment released to seller. Thank you!')
            onAction?.()
        } else {
            showToast(result.error ?? 'Something went wrong', 'error')
        }
    }

    async function handleDispute() {
        setLoading(true)
        const result = await actionDisputeOrder(order.id, disputeReason)
        setLoading(false)
        if (result.success) {
            showToast('Dispute opened. Go2Hand will review within 24 hours.')
            setShowDisputeModal(false)
            onAction?.()
        } else {
            showToast(result.error ?? 'Something went wrong', 'error')
        }
    }

    async function handleCancel() {
        if (!confirm('Are you sure you want to cancel this order?')) return
        setLoading(true)
        const result = await actionCancelOrder(order.id)
        setLoading(false)
        if (result.success) {
            showToast('Order cancelled.')
            onAction?.()
        } else {
            showToast(result.error ?? 'Something went wrong', 'error')
        }
    }

    // ── Render terminal states (not in the normal flow) ───────────
    if (order.status === 'cancelled' || order.status === 'refunded' || order.status === 'disputed') {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <TerminalState order={order} />
            </div>
        )
    }

    const currentStepIdx = getStepIndex(order.status)

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-gray-900">Escrow Status</h2>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_PILL_STYLES[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                </span>
            </div>

            {/* ── Step Timeline ── */}
            <div className="px-6 py-6">
                <div className="relative">
                    {/* Connecting line behind the steps */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" />
                    {/* Filled portion of the line */}
                    <div
                        className="absolute top-5 left-5 h-0.5 bg-teal-500 transition-all duration-700"
                        style={{
                            // Each step is at 33.3% intervals (4 steps = 3 gaps)
                            width: currentStepIdx === 0
                                ? '0%'
                                : `calc(${(currentStepIdx / (ESCROW_STEPS.length - 1)) * 100}% - 0px)`,
                        }}
                    />

                    <div className="relative flex justify-between">
                        {ESCROW_STEPS.map((step, i) => {
                            const isDone = currentStepIdx > i
                            const isCurrent = currentStepIdx === i
                            const Icon = step.icon

                            return (
                                <div
                                    key={step.status}
                                    className="flex flex-col items-center"
                                    style={{ width: '25%' }}
                                >
                                    {/* Circle indicator */}
                                    <div
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center
                                            border-2 transition-all duration-300 z-10 bg-white
                                            ${isDone
                                                ? 'border-teal-500 bg-teal-500'
                                                : isCurrent
                                                    ? 'border-teal-600 shadow-lg shadow-teal-100'
                                                    : 'border-gray-200'
                                            }
                                        `}
                                    >
                                        {isDone ? (
                                            <CheckSolid className="w-5 h-5 text-white" />
                                        ) : (
                                            <Icon
                                                className={`w-5 h-5 ${isCurrent ? 'text-teal-600' : 'text-gray-300'}`}
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <p
                                        className={`mt-2 text-[11px] font-bold text-center leading-tight
                                            ${isCurrent ? 'text-teal-700' : isDone ? 'text-gray-700' : 'text-gray-300'}`}
                                    >
                                        {step.label}
                                    </p>

                                    {/* Timestamp */}
                                    {order[step.timestampKey] && (
                                        <p className="mt-0.5 text-[10px] text-gray-400 text-center leading-tight">
                                            {formatTimestamp(order[step.timestampKey] as string)}
                                        </p>
                                    )}

                                    {/* "Now" indicator for current step */}
                                    {isCurrent && !order[step.timestampKey] && (
                                        <p className="mt-0.5 text-[10px] text-teal-500 font-semibold text-center">
                                            Now
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── Inspection countdown ── */}
                {order.status === 'in_inspection' && inspectionDays !== null && (
                    <div className={`
                        mt-5 flex items-center gap-3 rounded-xl px-4 py-3
                        ${inspectionDays <= 1
                            ? 'bg-red-50 border border-red-100'
                            : 'bg-amber-50 border border-amber-100'
                        }
                    `}>
                        <ClockIcon className={`w-5 h-5 shrink-0 ${inspectionDays <= 1 ? 'text-red-500' : 'text-amber-500'}`} />
                        <div>
                            <p className={`text-sm font-bold ${inspectionDays <= 1 ? 'text-red-800' : 'text-amber-800'}`}>
                                {inspectionDays === 0
                                    ? 'Inspection period expires today'
                                    : `${inspectionDays} day${inspectionDays !== 1 ? 's' : ''} left to inspect`
                                }
                            </p>
                            <p className={`text-xs mt-0.5 ${inspectionDays <= 1 ? 'text-red-600' : 'text-amber-600'}`}>
                                After this, payment is automatically released to the seller.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Tracking info (visible after shipping) ── */}
                {order.trackingNumber && (
                    <div className="mt-4 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                        <TruckIcon className="w-4 h-4 text-teal-600 shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-gray-700">
                                {order.shippingProvider ?? 'Carrier'}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">{order.trackingNumber}</p>
                        </div>
                    </div>
                )}

                {/* ── Action buttons ── */}
                {!isTerminal && (
                    <div className="mt-5 flex flex-col gap-2">

                        {/* SELLER ACTIONS */}
                        {role === 'seller' && order.status === 'paid' && (
                            <button
                                onClick={() => setShowShipModal(true)}
                                disabled={loading}
                                className="w-full h-11 bg-teal-800 hover:bg-teal-700 text-white
                                    font-semibold rounded-xl text-sm flex items-center justify-center gap-2
                                    transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                            >
                                <TruckIcon className="w-4 h-4" />
                                Mark as Shipped
                            </button>
                        )}

                        {/* BUYER ACTIONS */}
                        {role === 'buyer' && order.status === 'shipped' && (
                            <button
                                onClick={handleMarkReceived}
                                disabled={loading}
                                className="w-full h-11 bg-teal-800 hover:bg-teal-700 text-white
                                    font-semibold rounded-xl text-sm flex items-center justify-center gap-2
                                    transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                {loading ? 'Updating…' : 'I Received the Device'}
                            </button>
                        )}

                        {role === 'buyer' && order.status === 'in_inspection' && (
                            <>
                                <button
                                    onClick={handleComplete}
                                    disabled={loading}
                                    className="w-full h-11 bg-teal-800 hover:bg-teal-700 text-white
                                        font-semibold rounded-xl text-sm flex items-center justify-center gap-2
                                        transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                                >
                                    <CheckSolid className="w-4 h-4" />
                                    {loading ? 'Processing…' : 'Approve & Release Payment'}
                                </button>
                                <button
                                    onClick={() => setShowDisputeModal(true)}
                                    disabled={loading}
                                    className="w-full h-10 border-2 border-red-200 text-red-600
                                        hover:bg-red-50 font-semibold rounded-xl text-sm
                                        flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ExclamationTriangleIcon className="w-4 h-4" />
                                    Raise a Dispute
                                </button>
                            </>
                        )}

                        {/* Cancel — buyer only, before shipping */}
                        {role === 'buyer' && ['pending', 'paid'].includes(order.status) && (
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="w-full h-9 text-xs text-gray-400 hover:text-red-500
                                    hover:bg-red-50 rounded-lg transition-colors font-medium"
                            >
                                Cancel Order
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Ship Modal ── */}
            {showShipModal && (
                <Modal title="Confirm Shipment" onClose={() => setShowShipModal(false)}>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                                Shipping Provider
                            </label>
                            <select
                                value={shippingProvider}
                                onChange={(e) => setShippingProvider(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                                    focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
                            >
                                {['J&T Express', 'ViettelPost', 'GHTK', 'GHN', 'Ninja Van', 'Other'].map(p => (
                                    <option key={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                                Tracking Number <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. JT1234567890VN"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                                    focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleMarkShipped}
                            disabled={loading || !trackingNumber.trim()}
                            className="w-full h-11 bg-teal-800 hover:bg-teal-700 text-white
                                font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                            {loading ? 'Confirming…' : 'Confirm Shipment'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Dispute Modal ── */}
            {showDisputeModal && (
                <Modal title="Open a Dispute" onClose={() => setShowDisputeModal(false)}>
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-500">
                            Describe the issue with the device. Go2Hand will review and respond within 24 hours.
                        </p>
                        <textarea
                            rows={4}
                            placeholder="e.g. The battery health is 60%, not 90% as listed. Photos attached..."
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                                focus:border-red-300 focus:ring-2 focus:ring-red-50 outline-none resize-none"
                        />
                        <button
                            onClick={handleDispute}
                            disabled={loading || disputeReason.trim().length < 10}
                            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white
                                font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                            {loading ? 'Submitting…' : 'Submit Dispute'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Toast ── */}
            {toast && (
                <div className={`
                    fixed bottom-7 right-7 z-50 px-5 py-3.5 rounded-xl shadow-2xl
                    flex items-center gap-3 text-sm font-medium
                    animate-[fadeUp_.3s_ease_both]
                    ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}
                `}>
                    {toast.type === 'success'
                        ? <CheckSolid className="w-5 h-5 text-emerald-400" />
                        : <ExclamationTriangleIcon className="w-5 h-5" />
                    }
                    {toast.message}
                </div>
            )}
        </div>
    )
}

// ── Terminal state display (cancelled/refunded/disputed) ──────────
function TerminalState({ order }: { order: Order }) {
    const config = {
        cancelled: {
            icon: XCircleIcon,
            label: 'Order Cancelled',
            color: 'text-gray-500',
            bg: 'bg-gray-50',
            border: 'border-gray-100',
            desc: order.cancelledAt
                ? `Cancelled on ${formatTimestamp(order.cancelledAt)}`
                : 'This order has been cancelled.',
        },
        refunded: {
            icon: ArrowPathIcon,
            label: 'Refund Processed',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            desc: order.refundedAt
                ? `Refunded on ${formatTimestamp(order.refundedAt)}`
                : 'Your refund has been processed.',
        },
        disputed: {
            icon: ExclamationTriangleIcon,
            label: 'Dispute Open',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            desc: order.disputeReason ?? 'Go2Hand is reviewing your dispute.',
        },
    }

    const c = config[order.status as keyof typeof config]
    const Icon = c.icon

    return (
        <div className={`flex items-start gap-4 px-6 py-6 ${c.bg} border-b ${c.border}`}>
            <div className={`w-10 h-10 rounded-full ${c.bg} border ${c.border}
                flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div>
                <p className={`text-sm font-bold ${c.color}`}>{c.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.desc}</p>
            </div>
        </div>
    )
}

// ── Inline modal ──────────────────────────────────────────────────
function Modal({
    title,
    children,
    onClose,
}: {
    title: string
    children: React.ReactNode
    onClose: () => void
}) {
    return (
        // Using a div with min-height instead of fixed positioning
        // (fixed breaks iframe height in some Claude artifact renderers)
        <div
            className="absolute inset-0 z-40 bg-black/30 flex items-end sm:items-center
                justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Pending Payment',
    paid: 'In Escrow',
    shipped: 'Shipped',
    in_inspection: 'Inspection',
    completed: 'Completed',
    disputed: 'Disputed',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
}

const STATUS_PILL_STYLES: Record<OrderStatus, string> = {
    pending: 'bg-gray-100 text-gray-600',
    paid: 'bg-emerald-100 text-emerald-700',
    shipped: 'bg-blue-100 text-blue-700',
    in_inspection: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    disputed: 'bg-red-100 text-red-700',
    refunded: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-500',
}

// Named export so it can also be used as a standalone badge anywhere
export { STATUS_LABELS, STATUS_PILL_STYLES }