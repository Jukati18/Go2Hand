// src/components/orders/EscrowTimelineMini.tsx
// ─────────────────────────────────────────────────────────────────
// ESCROW TIMELINE MINI
//
// Compact horizontal step indicator showing where an order sits
// in the escrow lifecycle. Used inside OrderHistoryCard so buyers
// and sellers can grasp the status at a glance without expanding.
//
// Steps:   Paid → Shipped → Inspecting → Completed
// Terminal states (cancelled / refunded / disputed) shown as a
// single-row badge instead of the progress line.
// ─────────────────────────────────────────────────────────────────

import {
    ShieldCheckIcon,
    TruckIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import type { OrderStatus } from '@/types/order'

// ── The four main escrow steps in order ──────────────────────────
const STEPS: { status: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { status: 'paid',          label: 'Secured',    icon: ShieldCheckIcon  },
    { status: 'shipped',       label: 'Shipped',    icon: TruckIcon        },
    { status: 'in_inspection', label: 'Inspection', icon: ClockIcon        },
    { status: 'completed',     label: 'Done',       icon: CheckCircleIcon  },
]

// ── Map each status to its step index (0-based) ──────────────────
const STEP_INDEX: Partial<Record<OrderStatus, number>> = {
    pending:       -1,  // before payment — show a "waiting" variant
    paid:           0,
    shipped:        1,
    in_inspection:  2,
    completed:      3,
}

// ── Terminal state config ─────────────────────────────────────────
const TERMINAL: Partial<Record<OrderStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }>> = {
    cancelled: {
        label: 'Order Cancelled',
        icon:  XCircleIcon,
        color: 'text-gray-500',
        bg:    'bg-gray-100',
    },
    refunded: {
        label: 'Refunded',
        icon:  ArrowPathIcon,
        color: 'text-blue-600',
        bg:    'bg-blue-100',
    },
    disputed: {
        label: 'Dispute Open',
        icon:  ExclamationTriangleIcon,
        color: 'text-amber-600',
        bg:    'bg-amber-100',
    },
}

interface EscrowTimelineMiniProps {
    status: OrderStatus
    /** Show labels under each dot (default true) */
    showLabels?: boolean
    className?: string
}

export default function EscrowTimelineMini({
    status,
    showLabels = true,
    className = '',
}: EscrowTimelineMiniProps) {
    // ── Terminal states — show a simple pill instead of the timeline ──
    const terminal = TERMINAL[status]
    if (terminal) {
        const Icon = terminal.icon
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className={`w-5 h-5 rounded-full ${terminal.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-3 h-3 ${terminal.color}`} />
                </div>
                <span className={`text-xs font-semibold ${terminal.color}`}>
                    {terminal.label}
                </span>
            </div>
        )
    }

    // ── Pending (before Stripe confirmation) ──────────────────────
    if (status === 'pending') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
                <span className="text-xs font-semibold text-gray-400">Awaiting payment</span>
            </div>
        )
    }

    const currentIdx = STEP_INDEX[status] ?? 0

    return (
        <div className={`flex items-center gap-0 ${className}`}>
            {STEPS.map((step, i) => {
                const isDone    = currentIdx > i
                const isCurrent = currentIdx === i
                const Icon      = step.icon

                return (
                    <div key={step.status} className="flex items-center">
                        {/* Connector line before each step (except first) */}
                        {i > 0 && (
                            <div
                                className={`h-[2px] w-6 sm:w-8 transition-colors duration-500 ${
                                    isDone || isCurrent ? 'bg-teal-500' : 'bg-gray-200'
                                }`}
                            />
                        )}

                        {/* Step dot */}
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={`
                                    w-6 h-6 rounded-full flex items-center justify-center
                                    border-2 transition-all duration-300
                                    ${isDone
                                        ? 'bg-teal-500 border-teal-500'
                                        : isCurrent
                                            ? 'bg-white border-teal-600 shadow-md shadow-teal-100'
                                            : 'bg-white border-gray-200'
                                    }
                                `}
                            >
                                {isDone ? (
                                    <CheckSolid className="w-3 h-3 text-white" />
                                ) : (
                                    <Icon
                                        className={`w-3 h-3 ${
                                            isCurrent ? 'text-teal-600' : 'text-gray-300'
                                        }`}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            {showLabels && (
                                <span
                                    className={`text-[9px] font-bold whitespace-nowrap leading-tight ${
                                        isCurrent
                                            ? 'text-teal-700'
                                            : isDone
                                                ? 'text-gray-500'
                                                : 'text-gray-300'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}