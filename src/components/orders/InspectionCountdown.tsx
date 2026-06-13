'use client'
// src/components/orders/InspectionCountdown.tsx
// ─────────────────────────────────────────────────────────────────
// Visual countdown for the 5-day inspection window.
//
// States:
//   safe    → teal/emerald — plenty of time
//   warning → amber — less than 24 hours
//   urgent  → red + pulse animation — less than 1 hour
//   expired → gray — window closed, auto-release pending
//
// Layout:
//   • Large time units: DD : HH : MM : SS
//   • Progress bar draining left→right as time runs out
//   • Deadline date string
//   • Contextual help text per urgency
// ─────────────────────────────────────────────────────────────────

import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useInspectionCountdown, type UrgencyLevel } from '@/hooks/useInspectionCountdown'

// ── Color tokens per urgency ──────────────────────────────────────
const URGENCY_CONFIG: Record<UrgencyLevel, {
    bg: string
    border: string
    barColor: string
    digitBg: string
    digitText: string
    labelText: string
    headingText: string
    subText: string
    iconColor: string
    pulse: boolean
}> = {
    safe: {
        bg:          'bg-teal-50',
        border:      'border-teal-200',
        barColor:    'bg-teal-500',
        digitBg:     'bg-white border border-teal-100',
        digitText:   'text-teal-900',
        labelText:   'text-teal-600',
        headingText: 'text-teal-900',
        subText:     'text-teal-700',
        iconColor:   'text-teal-600',
        pulse:       false,
    },
    warning: {
        bg:          'bg-amber-50',
        border:      'border-amber-300',
        barColor:    'bg-amber-500',
        digitBg:     'bg-white border border-amber-200',
        digitText:   'text-amber-900',
        labelText:   'text-amber-600',
        headingText: 'text-amber-900',
        subText:     'text-amber-700',
        iconColor:   'text-amber-500',
        pulse:       false,
    },
    urgent: {
        bg:          'bg-red-50',
        border:      'border-red-300',
        barColor:    'bg-red-500',
        digitBg:     'bg-white border border-red-200',
        digitText:   'text-red-900',
        labelText:   'text-red-600',
        headingText: 'text-red-900',
        subText:     'text-red-700',
        iconColor:   'text-red-500',
        pulse:       true,
    },
    expired: {
        bg:          'bg-gray-50',
        border:      'border-gray-200',
        barColor:    'bg-gray-400',
        digitBg:     'bg-white border border-gray-100',
        digitText:   'text-gray-500',
        labelText:   'text-gray-400',
        headingText: 'text-gray-600',
        subText:     'text-gray-500',
        iconColor:   'text-gray-400',
        pulse:       false,
    },
}

const URGENCY_MESSAGE: Record<UrgencyLevel, { title: string; desc: string }> = {
    safe: {
        title: 'Inspection Window Open',
        desc:  'Inspect the device carefully. Approve when you\'re satisfied, or raise a dispute if it doesn\'t match the listing.',
    },
    warning: {
        title: 'Less Than 24 Hours Left',
        desc:  'Your inspection window is closing soon. Approve the device or open a dispute before time runs out.',
    },
    urgent: {
        title: 'Less Than 1 Hour Remaining!',
        desc:  'Act now — the window is almost closed. Payment releases automatically to the seller when it expires.',
    },
    expired: {
        title: 'Inspection Period Closed',
        desc:  'The 5-day window has ended. Payment will be automatically released to the seller within the hour.',
    },
}

// ── Single digit block ─────────────────────────────────────────────
function DigitBlock({
    value,
    label,
    digitBg,
    digitText,
    labelText,
    pulse,
}: {
    value: number
    label: string
    digitBg: string
    digitText: string
    labelText: string
    pulse: boolean
}) {
    const display = String(value).padStart(2, '0')

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`
                w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center
                shadow-sm ${digitBg}
                ${pulse ? 'animate-pulse' : ''}
            `}>
                <span className={`text-2xl sm:text-3xl font-black tabular-nums leading-none ${digitText}`}>
                    {display}
                </span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${labelText}`}>
                {label}
            </span>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────
interface InspectionCountdownProps {
    inspectionStartedAt: string
    className?: string
}

export default function InspectionCountdown({
    inspectionStartedAt,
    className = '',
}: InspectionCountdownProps) {
    const countdown = useInspectionCountdown(inspectionStartedAt)

    if (!countdown) return null

    const c = URGENCY_CONFIG[countdown.urgencyLevel]
    const msg = URGENCY_MESSAGE[countdown.urgencyLevel]

    return (
        <div className={`${c.bg} border-2 ${c.border} rounded-2xl overflow-hidden ${className}`}>

            {/* Header */}
            <div className={`flex items-center gap-3 px-5 py-4 border-b ${c.border}`}>
                <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
                    {countdown.isExpired
                        ? <CheckCircleIcon className={`w-5 h-5 ${c.iconColor}`} />
                        : countdown.urgencyLevel === 'urgent'
                            ? <ExclamationTriangleIcon className={`w-5 h-5 ${c.iconColor} ${c.pulse ? 'animate-bounce' : ''}`} />
                            : <ClockIcon className={`w-5 h-5 ${c.iconColor}`} />
                    }
                </div>
                <div>
                    <p className={`text-sm font-bold ${c.headingText}`}>{msg.title}</p>
                    <p className={`text-xs mt-0.5 leading-relaxed ${c.subText}`}>{msg.desc}</p>
                </div>
            </div>

            {/* Digit countdown */}
            {!countdown.isExpired && (
                <div className="px-5 py-5">
                    <div className="flex items-start justify-center gap-3 sm:gap-4 mb-5">
                        <DigitBlock
                            value={countdown.days}
                            label="Days"
                            digitBg={c.digitBg}
                            digitText={c.digitText}
                            labelText={c.labelText}
                            pulse={c.pulse}
                        />

                        {/* Colon separator */}
                        <span className={`text-2xl font-black mt-3 ${c.digitText} select-none`}>:</span>

                        <DigitBlock
                            value={countdown.hours}
                            label="Hours"
                            digitBg={c.digitBg}
                            digitText={c.digitText}
                            labelText={c.labelText}
                            pulse={c.pulse}
                        />

                        <span className={`text-2xl font-black mt-3 ${c.digitText} select-none`}>:</span>

                        <DigitBlock
                            value={countdown.minutes}
                            label="Mins"
                            digitBg={c.digitBg}
                            digitText={c.digitText}
                            labelText={c.labelText}
                            pulse={c.pulse}
                        />

                        <span className={`text-2xl font-black mt-3 ${c.digitText} select-none`}>:</span>

                        <DigitBlock
                            value={countdown.seconds}
                            label="Secs"
                            digitBg={c.digitBg}
                            digitText={c.digitText}
                            labelText={c.labelText}
                            pulse={c.pulse}
                        />
                    </div>

                    {/* Progress bar — fills as time runs OUT */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${c.labelText}`}>
                                Time elapsed
                            </span>
                            <span className={`text-[10px] font-bold ${c.labelText}`}>
                                {countdown.progressPercent}%
                            </span>
                        </div>
                        <div className="h-2 bg-white/70 rounded-full overflow-hidden border border-white">
                            <div
                                className={`h-full ${c.barColor} rounded-full transition-all duration-1000 ease-linear`}
                                style={{ width: `${countdown.progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Deadline string */}
                    <p className={`text-xs text-center ${c.subText}`}>
                        Window closes <span className="font-semibold">{countdown.formattedDeadline}</span>
                    </p>
                </div>
            )}
        </div>
    )
}