'use client'

// src/components/admin/OrdersTable.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN ORDERS TABLE — Interactive client component
//
// Features:
//   • Stat cards: total / active escrow / disputed / revenue
//   • Status filter tabs (All / In Escrow / Shipped / Inspection / Disputed / etc.)
//   • Search by order ID, buyer/seller username, device title
//   • Sort by amount, date
//   • Pagination (40 per page)
//   • Order Detail Drawer with:
//       - Full order metadata + Stripe PI ID
//       - Escrow timeline visual
//       - Buyer & seller info with profile links
//       - Admin action buttons:
//           Force Complete (capture + close)
//           Force Refund   (cancel hold / refund)
//           Force Cancel   (pre-shipment only)
//       - Admin note field
//       - Optimistic UI update on action
// ─────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ShieldCheckIcon,
    TruckIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    BoltIcon,
    ArrowTopRightOnSquareIcon,
    DevicePhoneMobileIcon,
    UserCircleIcon,
    CurrencyDollarIcon,
    FunnelIcon,
    TagIcon,
} from '@heroicons/react/24/outline'
import {
    CheckCircleIcon as CheckSolid,
    ShieldCheckIcon as ShieldSolid,
} from '@heroicons/react/24/solid'
import type { AdminOrder } from '@/app/admin/orders/page'
import {
    actionAdminOrderAction,
    type AdminOrderAction,
} from '@/actions/adminOrders'

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 40

// Status pill styles
const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-500',
    paid: 'bg-emerald-100 text-emerald-700',
    shipped: 'bg-blue-100 text-blue-700',
    in_inspection: 'bg-amber-100 text-amber-700',
    completed: 'bg-teal-100 text-teal-700',
    disputed: 'bg-red-100 text-red-700',
    refunded: 'bg-blue-100 text-blue-600',
    cancelled: 'bg-gray-100 text-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending Payment',
    paid: 'In Escrow',
    shipped: 'Shipped',
    in_inspection: 'In Inspection',
    completed: 'Completed',
    disputed: 'Disputed',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
}

// Which actions are valid per status
const AVAILABLE_ACTIONS: Record<string, AdminOrderAction[]> = {
    pending: ['force_cancel'],
    paid: ['force_complete', 'force_refund', 'force_cancel'],
    shipped: ['force_complete', 'force_refund'],
    in_inspection: ['force_complete', 'force_refund'],
    disputed: ['force_complete', 'force_refund'],
    completed: [],
    refunded: [],
    cancelled: [],
}

// Escrow step order for the mini-timeline
const STEP_ORDER = ['pending', 'paid', 'shipped', 'in_inspection', 'completed']

type SortKey = 'createdAt' | 'total'
type SortDir = 'asc' | 'desc'

function fmtUSD(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n)
}

function relDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff < 7) return `${diff}d ago`
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`
    return `${Math.floor(diff / 30)}mo ago`
}

function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

// ─────────────────────────────────────────────────────────────────
// SORT BUTTON
// ─────────────────────────────────────────────────────────────────
function SortBtn({ col, current, dir, onSort, label }: {
    col: SortKey; current: SortKey; dir: SortDir
    onSort: (c: SortKey) => void; label: string
}) {
    const active = current === col
    return (
        <button
            onClick={() => onSort(col)}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-400
                hover:text-gray-700 uppercase tracking-wider transition-colors whitespace-nowrap"
        >
            {label}
            {active
                ? dir === 'asc'
                    ? <ChevronUpIcon className="w-3 h-3 text-teal-600" />
                    : <ChevronDownIcon className="w-3 h-3 text-teal-600" />
                : <ChevronUpDownIcon className="w-3 h-3" />
            }
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────
// MINI ESCROW TIMELINE (used inside drawer)
// ─────────────────────────────────────────────────────────────────
function EscrowTimeline({ status }: { status: string }) {
    const steps = [
        { key: 'paid', label: 'Escrowed', icon: ShieldCheckIcon },
        { key: 'shipped', label: 'Shipped', icon: TruckIcon },
        { key: 'in_inspection', label: 'Inspection', icon: ClockIcon },
        { key: 'completed', label: 'Completed', icon: CheckCircleIcon },
    ]

    const isTerminal = ['cancelled', 'refunded', 'disputed'].includes(status)
    const currentIdx = STEP_ORDER.indexOf(status)

    if (isTerminal) {
        const cfg = {
            cancelled: { icon: XCircleIcon, label: 'Order Cancelled', color: 'text-gray-500', bg: 'bg-gray-100' },
            refunded: { icon: ArrowPathIcon, label: 'Refunded', color: 'text-blue-600', bg: 'bg-blue-100' },
            disputed: { icon: ExclamationTriangleIcon, label: 'Under Dispute', color: 'text-red-600', bg: 'bg-red-100' },
        }[status as 'cancelled' | 'refunded' | 'disputed']

        return (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${cfg.bg}`}>
                <cfg.icon className={`w-5 h-5 ${cfg.color} shrink-0`} />
                <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-0">
            {steps.map((step, i) => {
                const stepIdx = STEP_ORDER.indexOf(step.key)
                const isDone = currentIdx > stepIdx
                const isCurrent = currentIdx === stepIdx
                const Icon = step.icon

                return (
                    <div key={step.key} className="flex items-center">
                        {i > 0 && (
                            <div className={`h-0.5 w-6 sm:w-10 ${isDone ? 'bg-teal-500' : 'bg-gray-200'} transition-colors`} />
                        )}
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                                ${isDone
                                    ? 'bg-teal-600 border-teal-600'
                                    : isCurrent
                                        ? 'bg-white border-teal-600 shadow-md shadow-teal-100'
                                        : 'bg-white border-gray-200'
                                }`}>
                                {isDone
                                    ? <CheckSolid className="w-4 h-4 text-white" />
                                    : <Icon className={`w-4 h-4 ${isCurrent ? 'text-teal-600' : 'text-gray-300'}`} />
                                }
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
                                ${isCurrent ? 'text-teal-700' : isDone ? 'text-gray-500' : 'text-gray-300'}`}>
                                {step.label}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// ACTION BUTTON CONFIG
// ─────────────────────────────────────────────────────────────────
const ACTION_CONFIG: Record<AdminOrderAction, {
    label: string
    desc: string
    icon: React.ComponentType<{ className?: string }>
    buttonStyle: string
    confirmStyle: string
    dangerous: boolean
}> = {
    force_complete: {
        label: 'Force Complete',
        desc: 'Capture Stripe hold → payment released to seller',
        icon: CheckCircleIcon,
        buttonStyle: 'border-emerald-300 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50',
        confirmStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white',
        dangerous: false,
    },
    force_refund: {
        label: 'Force Refund',
        desc: 'Cancel hold / refund → buyer gets their money back',
        icon: ArrowPathIcon,
        buttonStyle: 'border-blue-300 text-blue-700 hover:border-blue-500 hover:bg-blue-50',
        confirmStyle: 'bg-blue-600 hover:bg-blue-500 text-white',
        dangerous: false,
    },
    force_cancel: {
        label: 'Force Cancel',
        desc: 'Cancel order and release the listing back to marketplace',
        icon: XCircleIcon,
        buttonStyle: 'border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50',
        confirmStyle: 'bg-red-600 hover:bg-red-500 text-white',
        dangerous: true,
    },
}

// ─────────────────────────────────────────────────────────────────
// ORDER DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────
function OrderDrawer({
    order,
    onClose,
    onAction,
}: {
    order: AdminOrder
    onClose: () => void
    onAction: (id: string, action: AdminOrderAction, note: string) => Promise<void>
}) {
    const [selectedAction, setSelectedAction] = useState<AdminOrderAction | null>(null)
    const [adminNote, setAdminNote] = useState('')
    const [confirmStep, setConfirmStep] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const availableActions = AVAILABLE_ACTIONS[order.status] ?? []

    const activeCfg = selectedAction ? ACTION_CONFIG[selectedAction] : null
    const ActionIcon = activeCfg?.icon

    function showToast(msg: string, ok = true) {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    function handleSelectAction(a: AdminOrderAction) {
        setSelectedAction(a)
        setConfirmStep(false)
    }

    async function handleConfirm() {
        if (!selectedAction || !activeCfg || saving) return

        if (activeCfg.dangerous && !confirmStep) {
            setConfirmStep(true)
            return
        }

        setSaving(true)
        try {
            await onAction(order.id, selectedAction, adminNote)
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Action failed', false)
            setSaving(false)
            setConfirmStep(false)
        }
    }

    const platformFee = order.amount * 0.05
    const sellerPayout = order.amount - platformFee

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div
                className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[500px] bg-white
                    shadow-2xl overflow-y-auto"
                style={{ animation: 'slideInRight .25s ease both' }}
            >
                {/* ── Sticky header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100
                    sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2 min-w-0">
                        <ShieldSolid className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-mono text-sm font-bold text-gray-700 truncate">
                            #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0
                            ${STATUS_STYLES[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">

                    {/* ── Escrow timeline ── */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                            Escrow Status
                        </p>
                        <EscrowTimeline status={order.status} />
                    </div>

                    {/* ── Device ── */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Device
                        </p>
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3
                            border border-gray-100">
                            <div className="w-12 h-12 rounded-xl bg-white border border-gray-100
                                flex items-center justify-center overflow-hidden shrink-0">
                                {order.deviceImages?.[0] ? (
                                    <Image
                                        src={order.deviceImages[0]}
                                        alt={order.deviceTitle ?? ''}
                                        width={48} height={48} sizes="48px"
                                        className="w-full h-full object-contain p-1"
                                    />
                                ) : (
                                    <DevicePhoneMobileIcon className="w-5 h-5 text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {order.deviceTitle ?? '—'}
                                </p>
                                {order.deviceId && (
                                    <Link
                                        href={`/devices/${order.deviceId}`}
                                        target="_blank"
                                        className="flex items-center gap-1 text-[11px] text-teal-600
                                            hover:text-teal-800 font-medium mt-0.5 transition-colors w-fit"
                                    >
                                        View listing
                                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Buyer / Seller ── */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Buyer */}
                        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Buyer
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
                                    flex items-center justify-center shrink-0">
                                    <UserCircleIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate">
                                        @{order.buyerUsername ?? '—'}
                                    </p>
                                    {order.buyerId && (
                                        <Link href={`/profile/${order.buyerId}`} target="_blank"
                                            className="text-[10px] text-teal-600 hover:text-teal-800 font-medium
                                                transition-colors">
                                            Profile →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seller */}
                        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                Seller
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-600
                                    flex items-center justify-center shrink-0">
                                    <TagIcon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate">
                                        @{order.sellerUsername ?? '—'}
                                    </p>
                                    {order.sellerId && (
                                        <Link href={`/profile/${order.sellerId}`} target="_blank"
                                            className="text-[10px] text-teal-600 hover:text-teal-800 font-medium
                                                transition-colors">
                                            Profile →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Financial breakdown ── */}
                    <div className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Financial Details
                        </p>
                        <div className="flex flex-col gap-2">
                            {[
                                { label: 'Device price', value: fmtUSD(order.amount) },
                                { label: 'Shipping fee', value: order.shippingFee > 0 ? fmtUSD(order.shippingFee) : 'Free' },
                                { label: 'Buyer paid', value: fmtUSD(order.total), bold: true },
                                { label: 'Platform fee (5%)', value: fmtUSD(platformFee), muted: true },
                                { label: 'Seller payout', value: fmtUSD(sellerPayout), green: true },
                            ].map(({ label, value, bold, muted, green }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <span className={`text-xs ${muted ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {label}
                                    </span>
                                    <span className={`text-xs font-semibold
                                        ${bold ? 'text-gray-900 text-sm font-bold' : ''}
                                        ${muted ? 'text-gray-400' : ''}
                                        ${green ? 'text-emerald-600' : ''}`}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Stripe PI & timestamps ── */}
                    <div className="flex flex-col gap-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Technical Details
                        </p>
                        <div className="flex flex-col gap-1.5">
                            {[
                                { label: 'Order ID', value: order.id, mono: true },
                                {
                                    label: 'Stripe PI', value: order.stripePaymentIntentId ?? '—', mono: true, link: order.stripePaymentIntentId
                                        ? `https://dashboard.stripe.com/test/payments/${order.stripePaymentIntentId}`
                                        : undefined
                                },
                                { label: 'Created', value: fmtDateTime(order.createdAt), mono: false },
                                { label: 'Last updated', value: order.updatedAt ? fmtDateTime(order.updatedAt) : '—', mono: false },
                                ...(order.trackingNumber ? [
                                    { label: 'Tracking', value: `${order.shippingProvider ?? ''} ${order.trackingNumber}`.trim(), mono: true }
                                ] : []),
                                ...(order.disputeReason ? [
                                    { label: 'Dispute reason', value: order.disputeReason, mono: false }
                                ] : []),
                            ].map(({ label, value, mono, link }) => (
                                <div key={label} className="flex items-start justify-between gap-3">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase
                                        tracking-wider shrink-0 mt-0.5">
                                        {label}
                                    </span>
                                    {link ? (
                                        <Link
                                            href={link}
                                            target="_blank"
                                            className="flex items-center gap-1 text-[11px] text-teal-600
                                                hover:text-teal-800 font-mono truncate max-w-[230px] transition-colors"
                                        >
                                            {value}
                                            <ArrowTopRightOnSquareIcon className="w-3 h-3 shrink-0" />
                                        </Link>
                                    ) : (
                                        <span className={`text-[11px] text-gray-700 truncate max-w-[230px]
                                            ${mono ? 'font-mono' : 'font-medium'}`}>
                                            {value}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── View order link ── */}
                    <Link
                        href={`/orders/${order.id}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                            text-sm font-semibold text-gray-600 border-2 border-gray-200
                            hover:border-teal-400 hover:text-teal-700 transition-all"
                    >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        View Full Order Page
                    </Link>

                    {/* ── Admin actions (only for actionable statuses) ── */}
                    {availableActions.length > 0 && (
                        <>
                            <hr className="border-gray-100" />
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <BoltIcon className="w-4 h-4 text-gray-400" />
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        Admin Actions
                                    </h4>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-2 mb-4">
                                    {availableActions.map(action => {
                                        const cfg = ACTION_CONFIG[action]
                                        const isSelected = selectedAction === action

                                        return (
                                            <button
                                                key={action}
                                                onClick={() => handleSelectAction(action)}
                                                className={`flex items-start gap-3 p-3.5 rounded-xl border-2
                                                    text-left transition-all duration-150
                                                    ${isSelected
                                                        ? 'border-current shadow-sm'
                                                        : `bg-white ${cfg.buttonStyle}`
                                                    }
                                                    ${isSelected ? cfg.buttonStyle.replace('hover:', '') : ''}`}
                                            >
                                                <cfg.icon className="w-4 h-4 shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold leading-tight">
                                                        {cfg.label}
                                                    </p>
                                                    <p className="text-[10px] opacity-70 mt-0.5 leading-snug">
                                                        {cfg.desc}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <CheckSolid className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Admin note */}
                                {selectedAction && (
                                    <div className="mb-4 animate-[fadeIn_.2s_ease_both]">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Admin Note{' '}
                                            <span className="text-gray-400 font-normal">(logged in audit trail)</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={adminNote}
                                            onChange={e => setAdminNote(e.target.value)}
                                            placeholder="Reason for this admin action…"
                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                                                text-gray-800 outline-none resize-none
                                                focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition
                                                placeholder:text-gray-400"
                                        />
                                    </div>
                                )}

                                {/* Confirm / Submit */}
                                {activeCfg && ActionIcon && (
                                    <button
                                        disabled={saving}
                                        onClick={handleConfirm}
                                        className={`w-full h-11 rounded-xl font-bold text-sm flex items-center
            justify-center gap-2 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:enabled:-translate-y-0.5 hover:enabled:shadow-md
            ${confirmStep
                                                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                                                : activeCfg.confirmStyle
                                            }`}
                                    >
                                        {saving ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor"
                                                        strokeWidth="3" strokeOpacity=".3" />
                                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"
                                                        strokeWidth="3" strokeLinecap="round" />
                                                </svg>
                                                Applying…
                                            </>
                                        ) : confirmStep ? (
                                            <>
                                                <ExclamationTriangleIcon className="w-4 h-4" />
                                                Confirm: {activeCfg.label}?
                                            </>
                                        ) : (
                                            <>
                                                <ActionIcon className="w-4 h-4" />
                                                Apply: {activeCfg.label}
                                            </>
                                        )}
                                    </button>
                                )}

                                {!selectedAction && (
                                    <p className="text-[11px] text-gray-400 text-center">
                                        Select an action above to proceed
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* No actions available */}
                    {availableActions.length === 0 && (
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100
                            rounded-xl px-4 py-3">
                            <CheckSolid className="w-4 h-4 text-gray-400 shrink-0" />
                            <p className="text-xs text-gray-500">
                                No admin actions available for this order status.
                            </p>
                        </div>
                    )}
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl
                        flex items-center gap-2 text-sm font-medium animate-[fadeUp_.3s_ease_both]
                        ${toast.ok ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
                        {toast.ok
                            ? <CheckSolid className="w-4 h-4 text-emerald-400" />
                            : <ExclamationTriangleIcon className="w-4 h-4" />
                        }
                        {toast.msg}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeUp {
                    from { transform: translateY(8px); opacity: 0; }
                    to   { transform: translateY(0);   opacity: 1; }
                }
            `}</style>
        </>
    )
}

// ─────────────────────────────────────────────────────────────────
// MAIN TABLE COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function OrdersTable({ orders: initialOrders }: { orders: AdminOrder[] }) {
    const [orders, setOrders] = useState<AdminOrder[]>(initialOrders)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortKey, setSortKey] = useState<SortKey>('createdAt')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [page, setPage] = useState(1)
    const [selected, setSelected] = useState<AdminOrder | null>(null)

    function handleSort(col: SortKey) {
        if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(col); setSortDir('desc') }
        setPage(1)
    }

    // Optimistic update after admin action
    const handleAction = useCallback(async (
        id: string,
        action: AdminOrderAction,
        note: string
    ) => {
        const result = await actionAdminOrderAction(id, { action, adminNote: note })
        if (!result.success) throw new Error(result.error ?? 'Action failed')

        // Compute the new status to reflect optimistically
        const newStatus = action === 'force_complete' ? 'completed'
            : action === 'force_refund' ? 'refunded'
                : 'cancelled'

        setOrders(prev => prev.map(o =>
            o.id === id ? { ...o, status: newStatus } : o
        ))
        setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev)
    }, [])

    // Filter + sort pipeline
    const filtered = useMemo(() => {
        let result = orders

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(o => o.status === statusFilter)
        }

        // Search: order ID, buyer, seller, device title
        if (search.trim()) {
            const q = search.trim().toLowerCase()
            result = result.filter(o =>
                o.id.toLowerCase().includes(q) ||
                (o.buyerUsername ?? '').toLowerCase().includes(q) ||
                (o.sellerUsername ?? '').toLowerCase().includes(q) ||
                (o.deviceTitle ?? '').toLowerCase().includes(q)
            )
        }

        // Sort
        return [...result].sort((a, b) => {
            let av: number, bv: number
            if (sortKey === 'total') {
                av = a.total; bv = b.total
            } else {
                av = new Date(a.createdAt).getTime()
                bv = new Date(b.createdAt).getTime()
            }
            return sortDir === 'asc' ? av - bv : bv - av
        })
    }, [orders, statusFilter, search, sortKey, sortDir])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Tab counts
    const counts = useMemo(() => {
        const map: Record<string, number> = { all: orders.length }
        for (const o of orders) {
            map[o.status] = (map[o.status] ?? 0) + 1
        }
        return map
    }, [orders])

    // Status tabs — only show if there are orders in that status
    const STATUS_TABS = [
        { id: 'all', label: 'All Orders' },
        { id: 'disputed', label: 'Disputed' },
        { id: 'in_inspection', label: 'Inspecting' },
        { id: 'paid', label: 'In Escrow' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'completed', label: 'Completed' },
        { id: 'refunded', label: 'Refunded' },
        { id: 'cancelled', label: 'Cancelled' },
        { id: 'pending', label: 'Pending' },
    ].filter(t => t.id === 'all' || (counts[t.id] ?? 0) > 0 || statusFilter === t.id)

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* ── Toolbar ── */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200
                        rounded-xl px-3 py-2.5 focus-within:border-teal-400 focus-within:ring-1
                        focus-within:ring-teal-100 transition-all">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1) }}
                            placeholder="Search by order ID, buyer, seller, or device…"
                            className="w-full text-sm text-gray-800 bg-transparent outline-none
                                placeholder:text-gray-400"
                        />
                        {search && (
                            <button onClick={() => { setSearch(''); setPage(1) }}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Status tabs ── */}
                <div className="flex items-center gap-0 border-b border-gray-100 px-4 sm:px-5
                    overflow-x-auto scrollbar-none">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setStatusFilter(tab.id); setPage(1) }}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all
                                whitespace-nowrap -mb-px shrink-0
                                ${statusFilter === tab.id
                                    ? tab.id === 'disputed'
                                        ? 'border-red-500 text-red-800'
                                        : 'border-teal-600 text-teal-800'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                ${statusFilter === tab.id
                                    ? tab.id === 'disputed'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-teal-100 text-teal-700'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                {counts[tab.id] ?? 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Result count ── */}
                <div className="px-4 sm:px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-500">
                        Showing{' '}
                        <span className="font-semibold text-gray-800">
                            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}
                        </span>{' '}
                        of <span className="font-semibold text-gray-800">{filtered.length}</span> orders
                        {search && <span className="text-gray-400"> matching "{search}"</span>}
                    </p>
                </div>

                {/* ── TABLE ── */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 sm:px-5 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Order
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Status
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Buyer / Seller
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="total" current={sortKey} dir={sortDir}
                                        onSort={handleSort} label="Amount" />
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="createdAt" current={sortKey} dir={sortDir}
                                        onSort={handleSort} label="Date" />
                                </th>
                                <th className="px-4 sm:px-5 py-3 text-right">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Action
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-20 text-center">
                                        <ShieldCheckIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400">
                                            {search ? 'No orders match your search.' : 'No orders in this category.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((order, i) => (
                                    <tr
                                        key={order.id}
                                        className={`border-b border-gray-50 hover:bg-gray-50/60
                                            transition-colors cursor-pointer
                                            ${i % 2 === 1 ? 'bg-gray-50/30' : ''}
                                            ${order.status === 'disputed'
                                                ? 'border-l-2 border-l-red-400'
                                                : order.status === 'in_inspection'
                                                    ? 'border-l-2 border-l-amber-400'
                                                    : ''
                                            }`}
                                        onClick={() => setSelected(order)}
                                    >
                                        {/* Order ID + device */}
                                        <td className="px-4 sm:px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 border
                                                    border-gray-100 flex items-center justify-center
                                                    overflow-hidden shrink-0">
                                                    {order.deviceImages?.[0] ? (
                                                        <Image
                                                            src={order.deviceImages[0]}
                                                            alt={order.deviceTitle ?? ''}
                                                            width={40} height={40} sizes="40px"
                                                            className="w-full h-full object-contain p-0.5"
                                                        />
                                                    ) : (
                                                        <DevicePhoneMobileIcon className="w-4 h-4 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-mono text-xs font-bold text-gray-500">
                                                        #{order.id.slice(0, 8).toUpperCase()}
                                                    </p>
                                                    <p className="text-xs font-semibold text-gray-800 truncate
                                                        max-w-[140px] mt-0.5">
                                                        {order.deviceTitle ?? '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-3 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1
                                                rounded-full uppercase tracking-wide whitespace-nowrap
                                                ${STATUS_STYLES[order.status]}`}>
                                                {STATUS_LABELS[order.status]}
                                            </span>
                                        </td>

                                        {/* Buyer / Seller */}
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-xs text-gray-600 font-medium">
                                                    <span className="text-gray-400 font-normal">B: </span>
                                                    @{order.buyerUsername ?? '—'}
                                                </p>
                                                <p className="text-xs text-gray-600 font-medium">
                                                    <span className="text-gray-400 font-normal">S: </span>
                                                    @{order.sellerUsername ?? '—'}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-3 py-3 text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                {fmtUSD(order.total)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                +{fmtUSD(order.amount * 0.05)} fee
                                            </p>
                                        </td>

                                        {/* Date */}
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {relDate(order.createdAt)}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 sm:px-5 py-3 text-right">
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelected(order) }}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg
                                                    transition-colors whitespace-nowrap
                                                    ${order.status === 'disputed'
                                                        ? 'bg-red-500 hover:bg-red-400 text-white'
                                                        : (AVAILABLE_ACTIONS[order.status]?.length ?? 0) > 0
                                                            ? 'bg-teal-50 hover:bg-teal-100 text-teal-700'
                                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {order.status === 'disputed' ? 'Resolve' : 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 sm:px-5 py-4
                        border-t border-gray-100">
                        <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs
                                    font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40
                                    disabled:cursor-not-allowed transition-colors"
                            >
                                ← Prev
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let p: number
                                if (totalPages <= 5) p = i + 1
                                else if (page <= 3) p = i + 1
                                else if (page >= totalPages - 2) p = totalPages - 4 + i
                                else p = page - 2 + i
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                                            ${p === page
                                                ? 'bg-teal-700 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}>
                                        {p}
                                    </button>
                                )
                            })}
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs
                                    font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40
                                    disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detail Drawer ── */}
            {selected && (
                <OrderDrawer
                    order={selected}
                    onClose={() => setSelected(null)}
                    onAction={handleAction}
                />
            )}
        </>
    )
}