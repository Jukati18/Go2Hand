'use client'
// src/components/orders/ConfirmationNextSteps.tsx
// ─────────────────────────────────────────────────────────────────
// "What happens next" timeline component.
//
// Adapts its steps based on:
//   • Current order status
//   • Viewer role (buyer / seller)
//
// Each step has an icon, title, description, and optional CTA.
// Completed steps are visually checked off with a teal indicator.
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link'
import {
    ShieldCheckIcon,
    TruckIcon,
    ClockIcon,
    CheckCircleIcon,
    StarIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import type { OrderStatus } from '@/types/order'

// ── Step definitions ───────────────────────────────────────────────

interface StepConfig {
    icon: React.ComponentType<{ className?: string }>
    title: string
    desc: string
    // Which statuses mean this step is DONE
    doneWhen: OrderStatus[]
    // Which status means this step is CURRENT (active)
    activeWhen: OrderStatus[]
    // Optional CTA shown when step is active
    cta?: { label: string; href?: string; action?: 'approve' | 'dispute' | 'ship' }
}

// Steps for BUYER
const BUYER_STEPS: StepConfig[] = [
    {
        icon: ShieldCheckIcon,
        title: 'Payment secured in escrow',
        desc:  'Your money is ring-fenced — the seller receives nothing until you approve.',
        doneWhen:   ['paid', 'shipped', 'in_inspection', 'completed'],
        activeWhen: ['pending'],
    },
    {
        icon: TruckIcon,
        title: 'Seller ships your device',
        desc:  'The seller has been notified and will add a tracking number when shipped.',
        doneWhen:   ['shipped', 'in_inspection', 'completed'],
        activeWhen: ['paid'],
    },
    {
        icon: ClockIcon,
        title: 'Inspect the device (5 days)',
        desc:  'Once delivered, you have 5 days to check everything. Approve or raise a dispute.',
        doneWhen:   ['completed'],
        activeWhen: ['in_inspection'],
        cta:   { label: 'Review Order', href: '' }, // filled dynamically
    },
    {
        icon: CheckCircleIcon,
        title: 'Approve & release payment',
        desc:  'Happy with the device? Release payment to the seller and you\'re done.',
        doneWhen:   ['completed'],
        activeWhen: [],
    },
    {
        icon: StarIcon,
        title: 'Leave a review',
        desc:  'Help future buyers by rating the seller and device accuracy.',
        doneWhen:   [],
        activeWhen: ['completed'],
    },
]

// Steps for SELLER
const SELLER_STEPS: StepConfig[] = [
    {
        icon: ShieldCheckIcon,
        title: 'Buyer\'s payment secured',
        desc:  'Payment is held in escrow — guaranteed to release once the buyer approves.',
        doneWhen:   ['paid', 'shipped', 'in_inspection', 'completed'],
        activeWhen: ['pending'],
    },
    {
        icon: TruckIcon,
        title: 'Ship the device',
        desc:  'Pack it carefully and add a tracking number. The buyer will be notified.',
        doneWhen:   ['shipped', 'in_inspection', 'completed'],
        activeWhen: ['paid'],
        cta:   { label: 'Mark as Shipped', href: '' },
    },
    {
        icon: ClockIcon,
        title: 'Buyer inspects (5 days)',
        desc:  'The buyer has 5 days to verify the device matches your listing.',
        doneWhen:   ['completed'],
        activeWhen: ['in_inspection', 'shipped'],
    },
    {
        icon: CurrencyDollarIcon,
        title: 'Receive your payment',
        desc:  'Once the buyer approves (or the window expires), payment releases to you.',
        doneWhen:   ['completed'],
        activeWhen: [],
    },
]

// ── Status ordering for "done" calculation ─────────────────────────
const STATUS_ORDER: OrderStatus[] = [
    'pending', 'paid', 'shipped', 'in_inspection', 'completed',
]

function getStatusIndex(status: OrderStatus): number {
    return STATUS_ORDER.indexOf(status)
}

// ── Step row component ─────────────────────────────────────────────
function StepRow({
    step,
    index,
    status,
    orderId,
    isLast,
}: {
    step: StepConfig
    index: number
    status: OrderStatus
    orderId: string
    isLast: boolean
}) {
    const isDone    = step.doneWhen.includes(status)
    const isActive  = step.activeWhen.includes(status)
    const isPending = !isDone && !isActive

    const Icon = step.icon

    return (
        <div className="flex gap-4">
            {/* Icon column with vertical connector */}
            <div className="flex flex-col items-center">
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    border-2 transition-all duration-300
                    ${isDone
                        ? 'bg-teal-600 border-teal-600'
                        : isActive
                            ? 'bg-white border-teal-600 shadow-md shadow-teal-100'
                            : 'bg-white border-gray-200'
                    }
                `}>
                    {isDone ? (
                        <CheckSolid className="w-5 h-5 text-white" />
                    ) : (
                        <Icon className={`w-5 h-5 ${
                            isActive ? 'text-teal-600' : 'text-gray-300'
                        }`} />
                    )}
                </div>

                {/* Vertical line to next step */}
                {!isLast && (
                    <div className={`w-0.5 flex-1 mt-2 min-h-[24px] rounded-full
                        ${isDone ? 'bg-teal-400' : 'bg-gray-200'}`} />
                )}
            </div>

            {/* Content column */}
            <div className={`pb-6 flex-1 min-w-0 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-start gap-2 mb-1">
                    <p className={`text-sm font-bold leading-tight
                        ${isDone ? 'text-teal-800' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.title}
                    </p>
                    {isActive && (
                        <span className="shrink-0 text-[9px] font-black uppercase tracking-widest
                            bg-teal-600 text-white px-2 py-0.5 rounded-full mt-0.5">
                            Now
                        </span>
                    )}
                </div>
                <p className={`text-xs leading-relaxed
                    ${isDone ? 'text-teal-700' : isActive ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.desc}
                </p>

                {/* CTA when step is active */}
                {isActive && step.cta && (
                    <Link
                        href={step.cta.href ?? `/orders/${orderId}`}
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold
                            text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100
                            px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {step.cta.label}
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </Link>
                )}
            </div>
        </div>
    )
}

// ── Main export ────────────────────────────────────────────────────
interface ConfirmationNextStepsProps {
    status: OrderStatus
    role: 'buyer' | 'seller'
    orderId: string
    className?: string
}

export default function ConfirmationNextSteps({
    status,
    role,
    orderId,
    className = '',
}: ConfirmationNextStepsProps) {
    const steps = role === 'buyer' ? BUYER_STEPS : SELLER_STEPS

    // For terminal statuses, fall back gracefully
    const displayStatus: OrderStatus =
        ['disputed', 'refunded', 'cancelled'].includes(status)
            ? status
            : status

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">What happens next</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                    {role === 'buyer'
                        ? 'Your purchase is escrow-protected every step of the way.'
                        : 'Here\'s how your sale progresses through escrow.'
                    }
                </p>
            </div>
            <div className="px-5 sm:px-6 py-5">
                {steps.map((step, i) => (
                    <StepRow
                        key={i}
                        step={step}
                        index={i}
                        status={displayStatus}
                        orderId={orderId}
                        isLast={i === steps.length - 1}
                    />
                ))}
            </div>
        </div>
    )
}