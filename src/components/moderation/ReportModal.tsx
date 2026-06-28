'use client'

// src/components/moderation/ReportModal.tsx
// ─────────────────────────────────────────────────────────────────
// REPORT MODAL — User-facing content report dialog
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
    FlagIcon,
    XMarkIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import {
    actionSubmitReport,
    REPORT_REASON_LABELS,
    type ReportTargetType,
    type ReportReason,
} from '@/actions/report'

interface ReportModalProps {
    targetType: ReportTargetType
    targetId: string
    /** Display name shown in the modal header */
    targetTitle: string
    /** Trigger element — usually a <button> */
    children: React.ReactNode
}

const LISTING_REASONS: ReportReason[] = [
    'scam',
    'counterfeit',
    'stolen_device',
    'spam',
    'inappropriate',
    'wrong_category',
    'other',
]

const USER_REASONS: ReportReason[] = [
    'scam',
    'offensive_content',
    'spam',
    'inappropriate',
    'other',
]

// ── Fallback dictionary in case the import from '@/actions/report' fails ──
const FALLBACK_LABELS: Record<string, string> = {
    scam: 'Scam or fraud',
    counterfeit: 'Counterfeit / fake product',
    stolen_device: 'Potentially stolen device',
    spam: 'Spam or misleading',
    inappropriate: 'Inappropriate content',
    wrong_category: 'Listed in the wrong category',
    offensive_content: 'Offensive or abusive behavior',
    other: 'Other issue',
}

export default function ReportModal({
    targetType,
    targetId,
    targetTitle,
    children,
}: ReportModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
    const [details, setDetails] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Required for Next.js SSR so createPortal doesn't fire on the server
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const reasons = targetType === 'listing' ? LISTING_REASONS : USER_REASONS
    const headerLabel = targetType === 'listing' ? 'Report Listing' : 'Report User'

    function handleClose() {
        if (submitting) return
        setIsOpen(false)
        setTimeout(() => {
            setSelectedReason(null)
            setDetails('')
            setSubmitted(false)
            setError(null)
        }, 300)
    }

    async function handleSubmit() {
        if (!selectedReason || submitting) return
        setError(null)
        setSubmitting(true)

        const result = await actionSubmitReport({
            targetType,
            targetId,
            reason: selectedReason,
            details: details.trim() || undefined,
        })

        setSubmitting(false)

        if (!result.success) {
            setError(result.error ?? 'Failed to submit report. Please try again.')
            return
        }

        setSubmitted(true)
    }

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center
            bg-black/40 backdrop-blur-sm p-4 animate-[fadeIn_.2s_ease_both]"
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_.25s_ease_both]">
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                            <FlagIcon className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">{headerLabel}</h2>
                            <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                                {targetTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        aria-label="Close report modal"
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Success state ── */}
                {submitted ? (
                    <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                            <CheckSolid className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">Report submitted</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Thanks for helping keep Go2Hand safe. Our team will review this within 24 hours.
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors mt-1"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    /* ── Form state ── */
                    <div className="p-5 flex flex-col gap-4">
                        <div>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                                What&apos;s the issue?
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {reasons.map((reason) => {
                                    // Resolves text safely: Try Import -> Try Fallback -> print raw key as last resort
                                    const labelText = REPORT_REASON_LABELS?.[reason] || FALLBACK_LABELS[reason] || reason;

                                    return (
                                        <button
                                            key={reason}
                                            type="button"
                                            onClick={() => setSelectedReason(reason)}
                                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 text-left transition-all duration-150 ${
                                                selectedReason === reason
                                                    ? 'border-red-400 bg-red-50 text-red-900'
                                                    : 'border-gray-100 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span
                                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                    selectedReason === reason
                                                        ? 'border-red-500 bg-red-500'
                                                        : 'border-gray-300 bg-white'
                                                }`}
                                            >
                                                {selectedReason === reason && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                )}
                                            </span>
                                            <span className="text-sm font-medium capitalize">
                                                {labelText}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {selectedReason && (
                            <div className="animate-[fadeIn_.2s_ease_both]">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Additional details{' '}
                                    <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    maxLength={500}
                                    placeholder="Describe the issue in more detail…"
                                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition placeholder:text-gray-400"
                                />
                                <p className="text-[10px] text-gray-400 text-right mt-1">
                                    {details.length}/500
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
                                <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            Reports are reviewed confidentially by Go2Hand staff. False reports may result in account action.
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={submitting}
                                className="flex-1 h-10 border-2 border-gray-200 text-gray-500 font-semibold rounded-xl text-sm hover:border-gray-300 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!selectedReason || submitting}
                                onClick={handleSubmit}
                                className="flex-1 h-10 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 hover:enabled:shadow-md"
                            >
                                {submitting ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3" />
                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        <FlagIcon className="w-3.5 h-3.5" />
                                        Submit Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <>
            <span onClick={() => setIsOpen(true)} className="cursor-pointer inline-block">
                {children}
            </span>

            {/* Teleports modal to document.body, escaping card stacking contexts */}
            {isOpen && mounted && createPortal(modalContent, document.body)}

            <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to   { opacity: 1; }
                }
                @keyframes slideUp {
                  from { transform: translateY(16px); opacity: 0; }
                  to   { transform: translateY(0);    opacity: 1; }
                }
            `}</style>
        </>
    )
}