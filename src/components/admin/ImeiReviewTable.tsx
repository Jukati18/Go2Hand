'use client'

// src/components/admin/ImeiReviewTable.tsx
// ─────────────────────────────────────────────────────────────────
// IMEI REVIEW TABLE — Client Component
//
// Features:
//   • Search by title / brand / seller
//   • Filter by listing status (active / pending_review / inactive)
//   • Filter by additional flags (iCloud locked, carrier locked)
//   • Sort by date, price, seller rating
//   • Pagination (30 per page — smaller batch for careful review)
//   • Review Drawer — detailed view + 3-option decision panel:
//       ✓ Clear Flag  — false positive, listing goes live verified
//       ✗ Remove      — confirmed suspicious, hidden from buyers
//       ⚠ Escalate   — needs more investigation, held for review
//   • Admin note field — optional context stored in audit log
//   • Optimistic UI — decision applied immediately in the table
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
    ShieldExclamationIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ArrowTopRightOnSquareIcon,
    FunnelIcon,
    DevicePhoneMobileIcon,
    StarIcon,
    TagIcon,
    ClockIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid, ShieldExclamationIcon as ShieldExclamSolid } from '@heroicons/react/24/solid'
import type { ImeiReviewItem } from '@/app/admin/reviews/page'
import {
    actionAdminReviewImei,
    type ImeiDecision,
} from '@/actions/adminImeiReview'

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 30

const STATUS_STYLES: Record<string, string> = {
    active:         'bg-emerald-100 text-emerald-700',
    inactive:       'bg-gray-100 text-gray-500',
    sold:           'bg-blue-100 text-blue-700',
    pending_review: 'bg-amber-100 text-amber-700',
}
const STATUS_LABELS: Record<string, string> = {
    active:         'Active',
    inactive:       'Removed',
    sold:           'Sold',
    pending_review: 'Pending',
}

const CONDITION_LABEL: Record<string, string> = {
    like_new:  'Like New',
    excellent: 'Excellent',
    good:      'Good',
    fair:      'Fair',
}
const CONDITION_STYLE: Record<string, string> = {
    like_new:  'bg-emerald-50 text-emerald-700',
    excellent: 'bg-teal-50 text-teal-700',
    good:      'bg-blue-50 text-blue-700',
    fair:      'bg-amber-50 text-amber-700',
}

type SortKey = 'createdAt' | 'price' | 'sellerRating'
type SortDir = 'asc' | 'desc'

function fmtUSD(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n)
}

function relDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff < 7)   return `${diff}d ago`
    if (diff < 30)  return `${Math.floor(diff / 7)}w ago`
    return `${Math.floor(diff / 30)}mo ago`
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
                    ? <ChevronUpIcon className="w-3 h-3 text-red-500" />
                    : <ChevronDownIcon className="w-3 h-3 text-red-500" />
                : <ChevronUpDownIcon className="w-3 h-3" />
            }
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────
// THUMBNAIL
// ─────────────────────────────────────────────────────────────────
function Thumb({ item, size = 'sm' }: { item: ImeiReviewItem; size?: 'sm' | 'lg' }) {
    const sizeMap = { sm: 'w-10 h-10', lg: 'w-28 h-28' }
    const px = size === 'sm' ? 40 : 112
    const src = item.images?.[0]

    return (
        <div className={`${sizeMap[size]} rounded-xl bg-gray-50 border border-gray-100
            flex items-center justify-center overflow-hidden shrink-0`}>
            {src ? (
                <Image src={src} alt={item.title} width={px} height={px}
                    sizes={`${px}px`} className="w-full h-full object-contain p-1" />
            ) : (
                <DevicePhoneMobileIcon className="w-5 h-5 text-gray-300" />
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// DECISION BUTTON — three variants shown side by side in the drawer
// ─────────────────────────────────────────────────────────────────
interface DecisionButtonProps {
    decision: ImeiDecision
    label: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    selected: boolean
    onClick: () => void
}

function DecisionButton({ decision, label, description, icon: Icon, selected, onClick }: DecisionButtonProps) {
    const styles: Record<ImeiDecision, { border: string; bg: string; text: string; iconColor: string }> = {
        clear:    { border: 'border-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-900', iconColor: 'text-emerald-600' },
        remove:   { border: 'border-red-400',     bg: 'bg-red-50',      text: 'text-red-900',     iconColor: 'text-red-600'     },
        escalate: { border: 'border-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-900',   iconColor: 'text-amber-600'   },
    }
    const s = styles[decision]

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2
                transition-all duration-200 text-center
                ${selected
                    ? `${s.border} ${s.bg} shadow-sm`
                    : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                ${selected ? s.bg : 'bg-gray-100'}`}>
                <Icon className={`w-5 h-5 ${selected ? s.iconColor : 'text-gray-400'}`} />
            </div>
            <div>
                <p className={`text-xs font-bold leading-tight ${selected ? s.text : 'text-gray-600'}`}>
                    {label}
                </p>
                <p className={`text-[10px] mt-0.5 leading-snug ${selected ? s.iconColor : 'text-gray-400'}`}>
                    {description}
                </p>
            </div>
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────
// REVIEW DRAWER
// ─────────────────────────────────────────────────────────────────
function ReviewDrawer({
    item,
    onClose,
    onDecision,
}: {
    item: ImeiReviewItem
    onClose: () => void
    onDecision: (id: string, decision: ImeiDecision, note: string) => Promise<void>
}) {
    const [selectedDecision, setSelectedDecision] = useState<ImeiDecision | null>(null)
    const [adminNote, setAdminNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    function showToast(msg: string, ok = true) {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3500)
    }

    async function handleSubmit() {
        if (!selectedDecision || saving) return
        setSaving(true)
        try {
            await onDecision(item.id, selectedDecision, adminNote)
            showToast(
                selectedDecision === 'clear'    ? '✓ Flag cleared — listing is now verified.' :
                selectedDecision === 'remove'   ? 'Listing removed from the marketplace.' :
                                                  'Listing escalated for further review.'
            )
            // Small delay so the user sees the toast, then close
            setTimeout(onClose, 1200)
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Action failed', false)
            setSaving(false)
        }
    }

    const DECISIONS: {
        decision: ImeiDecision
        label: string
        description: string
        icon: React.ComponentType<{ className?: string }>
    }[] = [
        {
            decision:    'clear',
            label:       'Clear Flag',
            description: 'False positive — keep live & mark verified',
            icon:        CheckCircleIcon,
        },
        {
            decision:    'remove',
            label:       'Remove',
            description: 'Suspicious — hide from buyers immediately',
            icon:        XCircleIcon,
        },
        {
            decision:    'escalate',
            label:       'Escalate',
            description: 'Hold pending deeper investigation',
            icon:        ExclamationTriangleIcon,
        },
    ]

    const verificationTime = item.lastCheckedAt
        ? new Date(item.lastCheckedAt).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        : '—'

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer — wider than UserDrawer since it has more content */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] bg-white
                shadow-2xl overflow-y-auto" style={{ animation: 'slideInRight .25s ease both' }}>

                {/* ── Sticky header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100
                    sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <ShieldExclamSolid className="w-4 h-4 text-red-500" />
                        <h3 className="text-sm font-bold text-gray-900">IMEI Review</h3>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
                            ${STATUS_STYLES[item.status]}`}>
                            {STATUS_LABELS[item.status]}
                        </span>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">

                    {/* ── Device identity ── */}
                    <div className="flex items-start gap-4">
                        <Thumb item={item} size="lg" />
                        <div className="flex-1 min-w-0 pt-1">
                            {item.brandName && (
                                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">
                                    {item.brandName}
                                </p>
                            )}
                            <h2 className="text-base font-bold text-gray-900 leading-snug mb-1.5">
                                {item.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                {item.condition && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md
                                        ${CONDITION_STYLE[item.condition] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {CONDITION_LABEL[item.condition] ?? item.condition}
                                    </span>
                                )}
                                {item.storageCapacity && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {item.storageCapacity}
                                    </span>
                                )}
                                {item.color && (
                                    <span className="text-[10px] text-gray-400">· {item.color}</span>
                                )}
                            </div>
                            <p className="text-lg font-black text-gray-900 mt-2">
                                {fmtUSD(item.price)}
                            </p>
                        </div>
                    </div>

                    {/* ── IMEI flag details card ── */}
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <ShieldExclamSolid className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-sm font-bold text-red-900">IMEI Flagged — Reported Stolen or Blacklisted</p>
                        </div>

                        {/* Verification metadata */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/70 rounded-xl px-3 py-2.5">
                                <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5">
                                    Check Method
                                </p>
                                <p className="font-semibold text-gray-800 capitalize">
                                    {item.checkMethod === 'mock_api'
                                        ? 'API Lookup'
                                        : item.checkMethod === 'luhn'
                                            ? 'Format Check'
                                            : item.checkMethod ?? '—'
                                    }
                                </p>
                            </div>
                            <div className="bg-white/70 rounded-xl px-3 py-2.5">
                                <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-0.5">
                                    Verified At
                                </p>
                                <p className="font-semibold text-gray-800">{verificationTime}</p>
                            </div>
                        </div>

                        {/* Lock status indicators */}
                        <div className="flex flex-wrap gap-2">
                            <div className={`flex items-center gap-1.5 text-xs font-semibold
                                px-3 py-1.5 rounded-lg
                                ${item.icloudStatus === 'locked'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                <ShieldCheckIcon className="w-3.5 h-3.5" />
                                iCloud: {item.icloudStatus === 'locked' ? 'LOCKED ⚠' : 'Unlocked'}
                            </div>
                            <div className={`flex items-center gap-1.5 text-xs font-semibold
                                px-3 py-1.5 rounded-lg
                                ${item.carrierStatus === 'locked'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                <InformationCircleIcon className="w-3.5 h-3.5" />
                                Carrier: {item.carrierStatus === 'locked' ? 'Locked' : 'Unlocked'}
                            </div>
                        </div>

                        <p className="text-[11px] text-red-600 leading-relaxed">
                            The IMEI/Serial number was checked against stolen device databases and returned a
                            &quot;flagged&quot; result. This may be a false positive from a mock API — verify against
                            real GSMA records before removing.
                        </p>
                    </div>

                    {/* ── Battery health ── */}
                    {item.batteryHealth !== null && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                            <span className="text-sm text-gray-500">Battery Health</span>
                            <span className={`text-sm font-bold ${
                                item.batteryHealth >= 90 ? 'text-emerald-600' :
                                item.batteryHealth >= 80 ? 'text-amber-600' : 'text-red-500'
                            }`}>
                                {item.batteryHealth}%
                            </span>
                        </div>
                    )}

                    {/* ── Seller info ── */}
                    {item.sellerUsername && (
                        <div className="bg-gray-50 rounded-2xl px-4 py-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Seller Profile
                            </p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">
                                        @{item.sellerUsername}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        {item.sellerRating > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                                                <StarIcon className="w-3.5 h-3.5" />
                                                {item.sellerRating.toFixed(1)}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <TagIcon className="w-3.5 h-3.5" />
                                            {item.sellerTotalSales} sales
                                        </span>
                                        {item.sellerVerified === 'verified' && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold
                                                text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                                <ShieldSolid className="w-2.5 h-2.5" />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {item.sellerId && (
                                    <Link
                                        href={`/profile/${item.sellerId}`}
                                        target="_blank"
                                        className="flex items-center gap-1.5 text-xs text-teal-600
                                            hover:text-teal-800 font-semibold transition-colors"
                                    >
                                        View Profile
                                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── View listing link ── */}
                    <Link
                        href={`/devices/${item.id}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                            text-sm font-semibold text-gray-600 border-2 border-gray-200
                            hover:border-teal-400 hover:text-teal-700 transition-all"
                    >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        View Public Listing
                    </Link>

                    <hr className="border-gray-100" />

                    {/* ── DECISION PANEL ── */}
                    <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                            Admin Decision
                        </h4>

                        {/* Three-way decision buttons */}
                        <div className="flex gap-2 mb-4">
                            {DECISIONS.map(d => (
                                <DecisionButton
                                    key={d.decision}
                                    {...d}
                                    selected={selectedDecision === d.decision}
                                    onClick={() => setSelectedDecision(d.decision)}
                                />
                            ))}
                        </div>

                        {/* Contextual explanation for the selected decision */}
                        {selectedDecision && (
                            <div className={`rounded-xl px-4 py-3 mb-4 text-xs leading-relaxed
                                animate-[fadeIn_.2s_ease_both]
                                ${selectedDecision === 'clear'
                                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                                    : selectedDecision === 'remove'
                                        ? 'bg-red-50 border border-red-100 text-red-700'
                                        : 'bg-amber-50 border border-amber-100 text-amber-700'
                                }`}>
                                {selectedDecision === 'clear' && (
                                    <>
                                        <strong>Clear Flag:</strong> Sets <code>imei_status = &apos;clean&apos;</code> and
                                        marks the listing as <strong>is_verified = true</strong>. The listing
                                        remains active and will display the &quot;Verified&quot; badge to buyers.
                                        Use this when you&apos;ve confirmed the flag was a false positive.
                                    </>
                                )}
                                {selectedDecision === 'remove' && (
                                    <>
                                        <strong>Remove:</strong> Sets <code>status = &apos;inactive&apos;</code>.
                                        The listing disappears from the marketplace immediately but is NOT
                                        deleted — the seller can still see it in their dashboard. IMEI flag
                                        remains. Seller should contact support to appeal.
                                    </>
                                )}
                                {selectedDecision === 'escalate' && (
                                    <>
                                        <strong>Escalate:</strong> Sets <code>status = &apos;pending_review&apos;</code>.
                                        Listing is hidden from buyers but preserved for deeper investigation.
                                        It will appear in the &quot;Pending Review&quot; tab of the listings table.
                                        Useful when you need to contact the seller or run further checks.
                                    </>
                                )}
                            </div>
                        )}

                        {/* Admin note */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Admin Note{' '}
                                <span className="text-gray-400 font-normal">(optional — logged in audit trail)</span>
                            </label>
                            <textarea
                                rows={3}
                                value={adminNote}
                                onChange={e => setAdminNote(e.target.value)}
                                placeholder="e.g. Verified against GSMA IMEI DB — confirmed stolen, seller notified…"
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                                    text-gray-800 outline-none resize-none
                                    focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition
                                    placeholder:text-gray-400"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            disabled={!selectedDecision || saving}
                            onClick={handleSubmit}
                            className={`w-full h-12 rounded-xl font-bold text-sm flex items-center
                                justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-wait
                                ${selectedDecision === 'clear'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:-translate-y-0.5 hover:shadow-md'
                                    : selectedDecision === 'remove'
                                        ? 'bg-red-600 hover:bg-red-500 text-white hover:-translate-y-0.5 hover:shadow-md'
                                        : selectedDecision === 'escalate'
                                            ? 'bg-amber-500 hover:bg-amber-400 text-white hover:-translate-y-0.5 hover:shadow-md'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                                    Applying decision…
                                </>
                            ) : !selectedDecision ? (
                                'Select a decision above'
                            ) : selectedDecision === 'clear' ? (
                                <>
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Clear Flag & Verify Listing
                                </>
                            ) : selectedDecision === 'remove' ? (
                                <>
                                    <XCircleIcon className="w-4 h-4" />
                                    Remove from Marketplace
                                </>
                            ) : (
                                <>
                                    <ClockIcon className="w-4 h-4" />
                                    Escalate for Investigation
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl
                        flex items-center gap-2 text-sm font-medium
                        animate-[fadeUp_.3s_ease_both]
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
                    to   { opacity: 1; transform: translateY(0);   }
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
// MAIN TABLE
// ─────────────────────────────────────────────────────────────────
export default function ImeiReviewTable({ items: initialItems }: { items: ImeiReviewItem[] }) {
    // Local state mirrors server data for optimistic updates
    const [items, setItems] = useState<ImeiReviewItem[]>(initialItems)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_review' | 'inactive'>('all')
    const [lockFilter, setLockFilter] = useState<'all' | 'icloud_locked' | 'carrier_locked'>('all')
    const [sortKey, setSortKey] = useState<SortKey>('createdAt')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [page, setPage] = useState(1)
    const [selected, setSelected] = useState<ImeiReviewItem | null>(null)

    function handleSort(col: SortKey) {
        if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(col); setSortDir('desc') }
        setPage(1)
    }

    // Optimistic update after decision — remove item from queue
    // (it will re-appear in listings table with updated status)
    const handleDecision = useCallback(async (
        id: string,
        decision: ImeiDecision,
        note: string
    ) => {
        const result = await actionAdminReviewImei(id, { decision, adminNote: note })
        if (!result.success) throw new Error(result.error ?? 'Action failed')
        // Remove from the local review queue — it's been handled
        setItems(prev => prev.filter(i => i.id !== id))
        setSelected(null)
    }, [])

    // Filter + sort
    const filtered = useMemo(() => {
        let result = items

        if (search.trim()) {
            const q = search.trim().toLowerCase()
            result = result.filter(i =>
                i.title.toLowerCase().includes(q) ||
                (i.brandName ?? '').toLowerCase().includes(q) ||
                (i.sellerUsername ?? '').toLowerCase().includes(q)
            )
        }

        if (statusFilter !== 'all') {
            result = result.filter(i => i.status === statusFilter)
        }

        if (lockFilter === 'icloud_locked') {
            result = result.filter(i => i.icloudStatus === 'locked')
        } else if (lockFilter === 'carrier_locked') {
            result = result.filter(i => i.carrierStatus === 'locked')
        }

        result = [...result].sort((a, b) => {
            let av: number, bv: number
            if (sortKey === 'createdAt') {
                av = new Date(a.createdAt).getTime()
                bv = new Date(b.createdAt).getTime()
            } else if (sortKey === 'sellerRating') {
                av = a.sellerRating
                bv = b.sellerRating
            } else {
                av = a.price
                bv = b.price
            }
            return sortDir === 'asc' ? av - bv : bv - av
        })

        return result
    }, [items, search, statusFilter, lockFilter, sortKey, sortDir])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Tab counts
    const counts = useMemo(() => ({
        all:            items.length,
        active:         items.filter(i => i.status === 'active').length,
        pending_review: items.filter(i => i.status === 'pending_review').length,
        inactive:       items.filter(i => i.status === 'inactive').length,
    }), [items])

    const STATUS_TABS = [
        { id: 'all' as const,            label: 'All Flagged'      },
        { id: 'active' as const,         label: 'Active (Urgent)'  },
        { id: 'pending_review' as const, label: 'Escalated'        },
        { id: 'inactive' as const,       label: 'Already Removed'  },
    ]

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* ── Toolbar ── */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200
                        rounded-xl px-3 py-2.5 focus-within:border-red-400 focus-within:ring-1
                        focus-within:ring-red-100 transition-all">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1) }}
                            placeholder="Search by title, brand, or seller…"
                            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                        />
                        {search && (
                            <button onClick={() => { setSearch(''); setPage(1) }}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Lock status filter */}
                    <div className="flex items-center gap-1.5">
                        <FunnelIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <select
                            value={lockFilter}
                            onChange={e => { setLockFilter(e.target.value as typeof lockFilter); setPage(1) }}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white
                                text-gray-700 outline-none focus:border-red-400 cursor-pointer"
                        >
                            <option value="all">All locks</option>
                            <option value="icloud_locked">⚠ iCloud Locked</option>
                            <option value="carrier_locked">Carrier Locked</option>
                        </select>
                    </div>
                </div>

                {/* ── Status tabs ── */}
                <div className="flex items-center gap-0 border-b border-gray-100 px-4 sm:px-5 overflow-x-auto">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setStatusFilter(tab.id); setPage(1) }}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all
                                whitespace-nowrap -mb-px
                                ${statusFilter === tab.id
                                    ? 'border-red-500 text-red-800'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                ${statusFilter === tab.id
                                    ? tab.id === 'active'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-200 text-gray-700'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                {counts[tab.id]}
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
                        of{' '}
                        <span className="font-semibold text-gray-800">{filtered.length}</span> flagged listings
                    </p>
                </div>

                {/* ── TABLE ── */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 sm:px-5 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Device
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Lock Status
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Listing Status
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="price" current={sortKey} dir={sortDir} onSort={handleSort} label="Price" />
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Seller
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="createdAt" current={sortKey} dir={sortDir} onSort={handleSort} label="Listed" />
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
                                    <td colSpan={7} className="px-5 py-20 text-center">
                                        <ShieldExclamationIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400">
                                            {search
                                                ? 'No flagged listings match your search.'
                                                : 'No listings in this category.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((item, i) => (
                                    <tr
                                        key={item.id}
                                        className={`border-b border-gray-50 hover:bg-red-50/30
                                            transition-colors cursor-pointer
                                            ${i % 2 === 1 ? 'bg-gray-50/30' : ''}
                                            ${item.status === 'active'
                                                // Bold left border for active-flagged (most urgent)
                                                ? 'border-l-2 border-l-red-400'
                                                : ''
                                            }`}
                                        onClick={() => setSelected(item)}
                                    >
                                        {/* Device cell */}
                                        <td className="px-4 sm:px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Thumb item={item} size="sm" />
                                                    {/* Red badge overlaid on thumbnail */}
                                                    <div className="absolute -top-1 -right-1 w-4 h-4
                                                        bg-red-500 rounded-full flex items-center justify-center">
                                                        <ShieldExclamationIcon className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    {item.brandName && (
                                                        <p className="text-[10px] font-bold text-teal-600
                                                            uppercase tracking-widest">
                                                            {item.brandName}
                                                        </p>
                                                    )}
                                                    <p className="text-sm font-semibold text-gray-900
                                                        truncate max-w-[160px]">
                                                        {item.title}
                                                    </p>
                                                    {item.storageCapacity && (
                                                        <p className="text-[11px] text-gray-400">
                                                            {item.storageCapacity}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Lock status */}
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`flex items-center gap-1 text-[10px] font-bold
                                                    px-2 py-0.5 rounded-full w-fit
                                                    ${item.icloudStatus === 'locked'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    <ShieldCheckIcon className="w-2.5 h-2.5" />
                                                    iCloud: {item.icloudStatus === 'locked' ? 'Locked' : 'OK'}
                                                </span>
                                                <span className={`flex items-center gap-1 text-[10px] font-bold
                                                    px-2 py-0.5 rounded-full w-fit
                                                    ${item.carrierStatus === 'locked'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    Carrier: {item.carrierStatus === 'locked' ? 'Locked' : 'OK'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Listing status */}
                                        <td className="px-3 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1
                                                rounded-full uppercase tracking-wide
                                                ${STATUS_STYLES[item.status]}`}>
                                                {STATUS_LABELS[item.status]}
                                            </span>
                                        </td>

                                        {/* Price */}
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-sm font-bold text-gray-900">
                                                {fmtUSD(item.price)}
                                            </span>
                                        </td>

                                        {/* Seller */}
                                        <td className="px-3 py-3">
                                            {item.sellerUsername ? (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700">
                                                        @{item.sellerUsername}
                                                    </p>
                                                    {item.sellerRating > 0 && (
                                                        <p className="text-[10px] text-amber-600 font-semibold">
                                                            {item.sellerRating.toFixed(1)} ★
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-300">—</span>
                                            )}
                                        </td>

                                        {/* Listed date */}
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {relDate(item.createdAt)}
                                            </span>
                                        </td>

                                        {/* Action button */}
                                        <td className="px-4 sm:px-5 py-3 text-right">
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelected(item) }}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg
                                                    transition-colors whitespace-nowrap
                                                    ${item.status === 'active'
                                                        ? 'bg-red-500 hover:bg-red-400 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                    }`}
                                            >
                                                {item.status === 'active' ? 'Review Now' : 'Review'}
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
                                if (totalPages <= 5)             p = i + 1
                                else if (page <= 3)              p = i + 1
                                else if (page >= totalPages - 2) p = totalPages - 4 + i
                                else                             p = page - 2 + i
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                                            ${p === page
                                                ? 'bg-red-600 text-white'
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

            {/* ── Review Drawer ── */}
            {selected && (
                <ReviewDrawer
                    item={selected}
                    onClose={() => setSelected(null)}
                    onDecision={handleDecision}
                />
            )}
        </>
    )
}