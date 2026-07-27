'use client'

// src/components/admin/ReportsTable.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN REPORTS TABLE — Interactive client component
//
// Features:
//   • Filter by target type (all / listing / user)
//   • Filter by status (pending / reviewed / dismissed)
//   • Search by target title or reporter name
//   • Sort by date
//   • Pagination (40 per page)
//   • Report Detail Drawer with:
//       - Target info (listing or user card)
//       - Reporter info
//       - 6-action decision panel:
//           dismiss / warn / ban_listing / ban 7d / ban 30d / ban permanent
//       - Admin note field
//       - Optimistic UI update
// ─────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    FlagIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ChevronUpDownIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldExclamationIcon,
    UserCircleIcon,
    DevicePhoneMobileIcon,
    ClockIcon,
    ArrowTopRightOnSquareIcon,
    NoSymbolIcon,
    BellAlertIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'
import type { AdminReport } from '@/app/admin/reports/page'
import {
    actionAdminResolveReport,
    type ReportDecision,
} from '@/actions/adminReports'
import { REPORT_REASON_LABELS } from '@/constants/report'

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 40

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    reviewed: 'bg-teal-100 text-teal-700',
    dismissed: 'bg-gray-100 text-gray-500',
}
const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    reviewed: 'Reviewed',
    dismissed: 'Dismissed',
}

const DECISION_LABELS: Record<string, string> = {
    dismiss: 'Dismissed',
    warn: 'Warning Sent',
    ban_listing: 'Listing Removed',
    ban_user_7d: 'Banned 7 Days',
    ban_user_30d: 'Banned 30 Days',
    ban_user_permanent: 'Permanently Banned',
}

type SortDir = 'asc' | 'desc'

function relDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff < 7) return `${diff}d ago`
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`
    return `${Math.floor(diff / 30)}mo ago`
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

interface DecisionOption {
    value: ReportDecision
    label: string
    desc: string
    icon: React.ComponentType<{ className?: string }>
    style: string
    selectedStyle: string
    available: boolean
}

// ─────────────────────────────────────────────────────────────────
// REPORT DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────
function ReportDrawer({
    report,
    onClose,
    onResolved,
}: {
    report: AdminReport
    onClose: () => void
    onResolved: (id: string, decision: ReportDecision, note: string) => Promise<void>
}) {
    const [selectedDecision, setSelectedDecision] = useState<ReportDecision | null>(null)
    const [adminNote, setAdminNote] = useState(report.adminNote ?? '')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    const isResolved = report.status !== 'pending'

    function showToast(msg: string, ok = true) {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    async function handleSubmit() {
        if (!selectedDecision || saving) return
        setSaving(true)
        try {
            await onResolved(report.id, selectedDecision, adminNote)
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Action failed', false)
            setSaving(false)
        }
    }

    // Decision options differ by target type
    // 1. Type the raw array directly so 'value' is strictly checked against ReportDecision
    const rawDecisions: DecisionOption[] = [
        {
            value: 'dismiss',
            label: 'Dismiss',
            desc: 'Not a real violation',
            icon: XCircleIcon,
            style: 'border-gray-200 text-gray-600 hover:border-gray-400',
            selectedStyle: 'border-gray-400 bg-gray-50 text-gray-900',
            available: true,
        },
        {
            value: 'warn',
            label: 'Warn User',
            desc: 'Issue warning, no action',
            icon: BellAlertIcon,
            style: 'border-amber-200 text-amber-700 hover:border-amber-400',
            selectedStyle: 'border-amber-400 bg-amber-50 text-amber-900',
            available: true,
        },
        {
            value: 'ban_listing',
            label: 'Remove Listing',
            desc: 'Hide from marketplace',
            icon: DevicePhoneMobileIcon,
            style: 'border-orange-200 text-orange-700 hover:border-orange-400',
            selectedStyle: 'border-orange-400 bg-orange-50 text-orange-900',
            available: report.targetType === 'listing',
        },
        {
            value: 'ban_user_7d',
            label: 'Ban 7 Days',
            desc: 'Temporary suspension',
            icon: ClockIcon,
            style: 'border-red-200 text-red-600 hover:border-red-400',
            selectedStyle: 'border-red-400 bg-red-50 text-red-900',
            available: true,
        },
        {
            value: 'ban_user_30d',
            label: 'Ban 30 Days',
            desc: 'Longer suspension',
            icon: ShieldExclamationIcon,
            style: 'border-red-300 text-red-700 hover:border-red-500',
            selectedStyle: 'border-red-500 bg-red-50 text-red-900',
            available: true,
        },
        {
            value: 'ban_user_permanent',
            label: 'Permanent Ban',
            desc: 'Remove from platform',
            icon: NoSymbolIcon,
            style: 'border-red-400 text-red-800 hover:border-red-600',
            selectedStyle: 'border-red-600 bg-red-100 text-red-900',
            available: true,
        },
    ]

    // 2. Filter on a separate step
    const decisions = rawDecisions.filter(d => d.available)

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-white
                shadow-2xl overflow-y-auto" style={{ animation: 'slideInRight .25s ease both' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100
                    sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <FlagIcon className="w-4 h-4 text-orange-500" />
                        <h3 className="text-sm font-bold text-gray-900">Report Detail</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
                            ${STATUS_STYLES[report.status]}`}>
                            {STATUS_LABELS[report.status]}
                        </span>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">

                    {/* ── Report info ── */}
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <FlagIcon className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-orange-900 mb-0.5">
                                    {REPORT_REASON_LABELS[report.reason as keyof typeof REPORT_REASON_LABELS] ?? report.reason}
                                </p>
                                {report.details && (
                                    <p className="text-xs text-orange-700 leading-relaxed mt-1">
                                        &quot;{report.details}&quot;
                                    </p>
                                )}
                                <p className="text-[10px] text-orange-500 mt-2 font-mono">
                                    {fmtDate(report.createdAt)}
                                    {report.reporterUsername && ` · by @${report.reporterUsername}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Target: Listing ── */}
                    {report.targetType === 'listing' && (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Reported Listing
                            </p>
                            <div className="flex items-center gap-3">
                                {/* Thumbnail */}
                                <div className="w-14 h-14 rounded-xl bg-white border border-gray-100
                                    flex items-center justify-center overflow-hidden shrink-0">
                                    {report.listingImages?.[0] ? (
                                        <Image
                                            src={report.listingImages[0]}
                                            alt={report.listingTitle ?? ''}
                                            width={56} height={56} sizes="56px"
                                            className="w-full h-full object-contain p-1"
                                        />
                                    ) : (
                                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {report.listingTitle ?? '—'}
                                    </p>
                                    {report.listingPrice && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            ${report.listingPrice.toLocaleString()}
                                        </p>
                                    )}
                                    {report.sellerUsername && (
                                        <p className="text-xs text-teal-600 mt-0.5">
                                            Seller: @{report.sellerUsername}
                                        </p>
                                    )}
                                    {report.listingStatus && (
                                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5
                                            rounded-full ${report.listingStatus === 'active'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {report.listingStatus}
                                        </span>
                                    )}
                                </div>
                                <Link href={`/devices/${report.targetId}`} target="_blank"
                                    className="text-teal-600 hover:text-teal-800 shrink-0 transition-colors">
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ── Target: User ── */}
                    {report.targetType === 'user' && (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Reported User
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400
                                    to-gray-500 flex items-center justify-center shrink-0">
                                    <UserCircleIcon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">
                                        @{report.targetUsername ?? '—'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        {report.targetRole && (
                                            <span className="text-[10px] text-gray-400 capitalize font-medium">
                                                {report.targetRole}
                                            </span>
                                        )}
                                        {report.targetIsBanned && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold
                                                bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                                <NoSymbolIcon className="w-2.5 h-2.5" />
                                                {report.targetBanType === 'permanent'
                                                    ? 'Permanently Banned'
                                                    : `Banned until ${report.targetBannedUntil
                                                        ? new Date(report.targetBannedUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                        : '—'}`
                                                }
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Link href={`/profile/${report.targetId}`} target="_blank"
                                    className="text-teal-600 hover:text-teal-800 shrink-0 transition-colors">
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ── Already resolved state ── */}
                    {isResolved && (
                        <div className={`rounded-2xl border p-4 ${report.status === 'dismissed'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-teal-50 border-teal-200'
                            }`}>
                            <p className={`text-sm font-bold mb-1 ${report.status === 'dismissed' ? 'text-gray-700' : 'text-teal-900'
                                }`}>
                                {report.status === 'dismissed' ? 'Dismissed' : `Decision: ${DECISION_LABELS[report.decision ?? ''] ?? report.decision}`}
                            </p>
                            {report.adminNote && (
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {report.adminNote}
                                </p>
                            )}
                            {report.reviewedAt && (
                                <p className="text-[10px] text-gray-400 mt-2 font-mono">
                                    Reviewed {fmtDate(report.reviewedAt)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Decision panel (only for pending reports) ── */}
                    {!isResolved && (
                        <>
                            <hr className="border-gray-100" />
                            <div>
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                    Admin Decision
                                </h4>

                                {/* Decision grid */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {decisions.map(d => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setSelectedDecision(d.value)}
                                            className={`flex flex-col items-start gap-1.5 p-3 rounded-xl
                                                border-2 text-left transition-all duration-150
                                                ${selectedDecision === d.value
                                                    ? d.selectedStyle
                                                    : `bg-white ${d.style}`
                                                }`}
                                        >
                                            <d.icon className="w-4 h-4" />
                                            <div>
                                                <p className="text-xs font-bold leading-tight">{d.label}</p>
                                                <p className="text-[10px] opacity-70 mt-0.5">{d.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Contextual explanation */}
                                {selectedDecision && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3
                                        mb-4 text-xs text-blue-700 leading-relaxed
                                        animate-[fadeIn_.2s_ease_both]">
                                        {selectedDecision === 'dismiss' && 'Report will be marked dismissed. No action taken on the target.'}
                                        {selectedDecision === 'warn' && 'Report marked reviewed. A warning is noted internally — no automatic notification sent.'}
                                        {selectedDecision === 'ban_listing' && 'The reported listing will be set to inactive and hidden from buyers immediately.'}
                                        {selectedDecision === 'ban_user_7d' && 'The reported/associated user will be suspended for 7 days. Active listings hidden.'}
                                        {selectedDecision === 'ban_user_30d' && 'The reported/associated user will be suspended for 30 days. All active listings hidden.'}
                                        {selectedDecision === 'ban_user_permanent' && '⚠️ The user will be permanently banned and all their active listings removed. This is irreversible from this panel.'}
                                    </div>
                                )}

                                {/* Admin note */}
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        Admin Note{' '}
                                        <span className="text-gray-400 font-normal">(logged in audit trail)</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={adminNote}
                                        onChange={e => setAdminNote(e.target.value)}
                                        placeholder="Optional context for this decision…"
                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5
                                            text-sm text-gray-800 outline-none resize-none
                                            focus:border-orange-400 focus:ring-2 focus:ring-orange-100
                                            transition placeholder:text-gray-400"
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    disabled={!selectedDecision || saving}
                                    onClick={handleSubmit}
                                    className={`w-full h-11 rounded-xl font-bold text-sm flex items-center
                                        justify-center gap-2 transition-all disabled:opacity-50
                                        disabled:cursor-not-allowed
                                        ${selectedDecision === 'dismiss'
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : selectedDecision === 'warn'
                                                ? 'bg-amber-500 hover:bg-amber-400 text-white'
                                                : (selectedDecision ?? '').startsWith('ban')
                                                    ? 'bg-red-600 hover:bg-red-500 text-white'
                                                    : 'bg-orange-600 hover:bg-orange-500 text-white'
                                        } hover:enabled:-translate-y-0.5 hover:enabled:shadow-md`}
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
                                    ) : !selectedDecision ? (
                                        'Select a decision above'
                                    ) : (
                                        `Apply: ${DECISION_LABELS[selectedDecision] ?? selectedDecision}`
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl
                        flex items-center gap-2 text-sm font-medium animate-[fadeUp_.3s_ease_both]
                        ${toast.ok ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
                        {toast.ok
                            ? <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
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
export default function ReportsTable({ reports: initialReports }: { reports: AdminReport[] }) {
    const [reports, setReports] = useState<AdminReport[]>(initialReports)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'listing' | 'user'>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed'>('pending')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [page, setPage] = useState(1)
    const [selected, setSelected] = useState<AdminReport | null>(null)

    const handleResolved = useCallback(async (
        id: string,
        decision: ReportDecision,
        note: string
    ) => {
        const result = await actionAdminResolveReport(id, { decision, adminNote: note })
        if (!result.success) throw new Error(result.error ?? 'Action failed')

        // Optimistically update the report status
        const newStatus = decision === 'dismiss' ? 'dismissed' : 'reviewed'
        setReports(prev => prev.map(r =>
            r.id === id
                ? { ...r, status: newStatus as AdminReport['status'], decision, adminNote: note, reviewedAt: new Date().toISOString() }
                : r
        ))
        setSelected(null)
    }, [])

    const filtered = useMemo(() => {
        let result = reports

        if (typeFilter !== 'all') result = result.filter(r => r.targetType === typeFilter)
        if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter)

        if (search.trim()) {
            const q = search.trim().toLowerCase()
            result = result.filter(r =>
                (r.listingTitle ?? '').toLowerCase().includes(q) ||
                (r.targetUsername ?? '').toLowerCase().includes(q) ||
                (r.reporterUsername ?? '').toLowerCase().includes(q) ||
                (r.sellerUsername ?? '').toLowerCase().includes(q)
            )
        }

        return [...result].sort((a, b) => {
            const av = new Date(a.createdAt).getTime()
            const bv = new Date(b.createdAt).getTime()
            return sortDir === 'asc' ? av - bv : bv - av
        })
    }, [reports, typeFilter, statusFilter, search, sortDir])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const counts = useMemo(() => ({
        all: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        reviewed: reports.filter(r => r.status === 'reviewed').length,
        dismissed: reports.filter(r => r.status === 'dismissed').length,
    }), [reports])

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200
                        rounded-xl px-3 py-2.5 focus-within:border-orange-400 focus-within:ring-1
                        focus-within:ring-orange-100 transition-all">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1) }}
                            placeholder="Search by listing, user, or reporter…"
                            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                        />
                        {search && (
                            <button onClick={() => { setSearch(''); setPage(1) }}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Type filter */}
                    <select
                        value={typeFilter}
                        onChange={e => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1) }}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white
                            text-gray-700 outline-none focus:border-orange-400 cursor-pointer shrink-0"
                    >
                        <option value="all">All types</option>
                        <option value="listing">Listing reports</option>
                        <option value="user">User reports</option>
                    </select>

                    {/* Date sort */}
                    <button
                        onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-xl
                            px-3 py-2 bg-white text-gray-700 hover:border-gray-300 transition-colors
                            shrink-0 font-medium"
                    >
                        Date
                        {sortDir === 'desc'
                            ? <ChevronDownIcon className="w-3.5 h-3.5" />
                            : <ChevronUpIcon className="w-3.5 h-3.5" />
                        }
                    </button>
                </div>

                {/* Status tabs */}
                <div className="flex items-center border-b border-gray-100 px-4 sm:px-5 overflow-x-auto">
                    {([
                        { id: 'pending' as const, label: 'Pending' },
                        { id: 'reviewed' as const, label: 'Reviewed' },
                        { id: 'dismissed' as const, label: 'Dismissed' },
                        { id: 'all' as const, label: 'All' },
                    ]).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setStatusFilter(tab.id); setPage(1) }}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all
                                whitespace-nowrap -mb-px
                                ${statusFilter === tab.id
                                    ? 'border-orange-500 text-orange-800'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                ${statusFilter === tab.id
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                {tab.id === 'all' ? counts.all : counts[tab.id]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Result count */}
                <div className="px-4 sm:px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-500">
                        Showing{' '}
                        <span className="font-semibold text-gray-800">
                            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}
                        </span>{' '}
                        of <span className="font-semibold text-gray-800">{filtered.length}</span> reports
                    </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 sm:px-5 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Target
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Reason
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Reporter
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Status
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <button
                                        onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                                        className="flex items-center gap-1 text-[11px] font-bold text-gray-400
                                            hover:text-gray-700 uppercase tracking-wider transition-colors ml-auto"
                                    >
                                        Date
                                        {sortDir === 'desc'
                                            ? <ChevronDownIcon className="w-3 h-3 text-orange-500" />
                                            : <ChevronUpIcon className="w-3 h-3 text-orange-500" />
                                        }
                                    </button>
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
                                        <CheckCircleIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400">
                                            {search ? 'No reports match your search.' : 'No reports in this category.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((report, i) => (
                                    <tr
                                        key={report.id}
                                        className={`border-b border-gray-50 hover:bg-orange-50/30
                                            transition-colors cursor-pointer
                                            ${i % 2 === 1 ? 'bg-gray-50/30' : ''}
                                            ${report.status === 'pending' ? 'border-l-2 border-l-orange-400' : ''}`}
                                        onClick={() => setSelected(report)}
                                    >
                                        {/* Target */}
                                        <td className="px-4 sm:px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                {/* Type badge */}
                                                <div className={`w-7 h-7 rounded-lg flex items-center
                                                    justify-center shrink-0
                                                    ${report.targetType === 'listing'
                                                        ? 'bg-teal-100'
                                                        : 'bg-purple-100'
                                                    }`}>
                                                    {report.targetType === 'listing'
                                                        ? <DevicePhoneMobileIcon className="w-3.5 h-3.5 text-teal-600" />
                                                        : <UserCircleIcon className="w-3.5 h-3.5 text-purple-600" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                                                        {report.targetType === 'listing'
                                                            ? (report.listingTitle ?? '—')
                                                            : `@${report.targetUsername ?? '—'}`
                                                        }
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                                                        {report.targetType}
                                                        {report.targetIsBanned && (
                                                            <span className="ml-1.5 text-red-600">• BANNED</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Reason */}
                                        <td className="px-3 py-3">
                                            <span className="text-xs font-medium text-gray-700">
                                                {REPORT_REASON_LABELS[report.reason as keyof typeof REPORT_REASON_LABELS] ?? report.reason}
                                            </span>
                                        </td>

                                        {/* Reporter */}
                                        <td className="px-3 py-3">
                                            <span className="text-xs text-gray-500">
                                                {report.reporterUsername ? `@${report.reporterUsername}` : '—'}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5
                                                    rounded-full w-fit ${STATUS_STYLES[report.status]}`}>
                                                    {STATUS_LABELS[report.status]}
                                                </span>
                                                {report.decision && (
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {DECISION_LABELS[report.decision] ?? report.decision}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {relDate(report.createdAt)}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 sm:px-5 py-3 text-right">
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelected(report) }}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg
                                                    transition-colors whitespace-nowrap
                                                    ${report.status === 'pending'
                                                        ? 'bg-orange-500 hover:bg-orange-400 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                    }`}
                                            >
                                                {report.status === 'pending' ? 'Review' : 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium
                                    text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                                    transition-colors"
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
                                            ${p === page ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                                        {p}
                                    </button>
                                )
                            })}
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium
                                    text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                                    transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Drawer */}
            {selected && (
                <ReportDrawer
                    report={selected}
                    onClose={() => setSelected(null)}
                    onResolved={handleResolved}
                />
            )}
        </>
    )
}