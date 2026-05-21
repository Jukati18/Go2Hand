// src/components/devices/VerificationBadge.tsx
// ─────────────────────────────────────────────────────────────────
// Compact badge shown on DeviceCard and DeviceDetailClient
// to surface the IMEI/Serial verification status at a glance.
//
// Variants:
//   'pill'   → used in DeviceCard (small, overlay-safe)
//   'row'    → used in specs table row
//   'banner' → used in device detail sidebar (full info)
// ─────────────────────────────────────────────────────────────────

import {
    ShieldCheckIcon,
    ShieldExclamationIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'

export type ImeiStatusValue = 'clean' | 'flagged' | 'unverified'

interface VerificationBadgeProps {
    status: ImeiStatusValue
    variant?: 'pill' | 'row' | 'banner'
    showLabel?: boolean
    className?: string
}

export default function VerificationBadge({
    status,
    variant = 'pill',
    showLabel = true,
    className = '',
}: VerificationBadgeProps) {

    // ── Pill variant ───────────────────────────────────────────────
    if (variant === 'pill') {
        if (status === 'clean') {
            return (
                <span className={`inline-flex items-center gap-1 bg-emerald-500 text-white
          text-[10px] font-bold px-2 py-0.5 rounded-full ${className}`}>
                    <ShieldSolid className="w-2.5 h-2.5" />
                    {showLabel && 'IMEI Clean'}
                </span>
            )
        }
        if (status === 'flagged') {
            return (
                <span className={`inline-flex items-center gap-1 bg-red-500 text-white
          text-[10px] font-bold px-2 py-0.5 rounded-full ${className}`}>
                    <ShieldExclamationIcon className="w-2.5 h-2.5" />
                    {showLabel && 'IMEI Flagged'}
                </span>
            )
        }
        return (
            <span className={`inline-flex items-center gap-1 bg-gray-200 text-gray-600
        text-[10px] font-bold px-2 py-0.5 rounded-full ${className}`}>
                <QuestionMarkCircleIcon className="w-2.5 h-2.5" />
                {showLabel && 'Not Verified'}
            </span>
        )
    }

    // ── Row variant (specs table) ──────────────────────────────────
    if (variant === 'row') {
        const cfg = {
            clean: { Icon: ShieldSolid, color: 'text-emerald-600', label: '✓ Clean — Not Blacklisted' },
            flagged: { Icon: ShieldExclamationIcon, color: 'text-red-600', label: '⚠ Flagged — Check Required' },
            unverified: { Icon: QuestionMarkCircleIcon, color: 'text-gray-400', label: '— Not Verified' },
        }[status]

        return (
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium
        ${cfg.color} ${className}`}>
                <cfg.Icon className="w-4 h-4 shrink-0" />
                {cfg.label}
            </span>
        )
    }

    // ── Banner variant (device detail sidebar) ────────────────────
    if (status === 'clean') {
        return (
            <div className={`flex items-start gap-3 bg-emerald-50 border border-emerald-100
        rounded-xl px-4 py-3.5 ${className}`}>
                <ShieldSolid className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-emerald-900 mb-0.5">IMEI Verified — Clean</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                        This device's IMEI has been checked against stolen/blacklisted databases
                        and returned clean. Safe to purchase.
                    </p>
                </div>
            </div>
        )
    }

    if (status === 'flagged') {
        return (
            <div className={`flex items-start gap-3 bg-red-50 border border-red-200
        rounded-xl px-4 py-3.5 ${className}`}>
                <ShieldExclamationIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-red-900 mb-0.5">⚠ IMEI Flagged</p>
                    <p className="text-xs text-red-700 leading-relaxed">
                        This IMEI has been reported as stolen or blacklisted.
                        Go2Hand strongly advises against purchasing this device.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex items-start gap-3 bg-gray-50 border border-gray-200
      rounded-xl px-4 py-3.5 ${className}`}>
            <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
                <p className="text-sm font-bold text-gray-600 mb-0.5">IMEI Not Verified</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                    This device has not been IMEI verified yet.
                    Proceed with caution and verify independently.
                </p>
            </div>
        </div>
    )
}