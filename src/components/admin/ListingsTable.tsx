'use client'

// src/components/admin/ListingsTable.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN LISTINGS TABLE — Interactive client component
//
// Features:
//   • Search by title / brand / seller username
//   • Filter by status (all / active / inactive / sold / pending_review)
//   • Filter by IMEI status (clean / flagged)
//   • Filter by condition grade
//   • Sort by price, views, date
//   • Pagination (50 per page)
//   • Listing detail drawer (slide-in panel) with:
//       - Cover photo + details
//       - Status change (active / inactive / pending_review)
//       - Toggle featured
//       - Toggle verified
//       - Hard delete (with confirm)
//       - External link to public listing
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
    StarIcon,
    EyeIcon,
    TrashIcon,
    ArrowTopRightOnSquareIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    DevicePhoneMobileIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid'
import type { AdminListing } from '@/app/admin/listings/page'
import {
    actionAdminUpdateListing,
    actionAdminDeleteListing,
    type ListingStatus,
} from '@/actions/adminListings'

// ─────────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    active:         'bg-emerald-100 text-emerald-700',
    inactive:       'bg-gray-100 text-gray-500',
    sold:           'bg-blue-100 text-blue-700',
    pending_review: 'bg-amber-100 text-amber-700',
}
const STATUS_LABELS: Record<string, string> = {
    active:         'Active',
    inactive:       'Inactive',
    sold:           'Sold',
    pending_review: 'Pending',
}

const CONDITION_LABELS: Record<string, string> = {
    like_new:  'Like New',
    excellent: 'Excellent',
    good:      'Good',
    fair:      'Fair',
}
const CONDITION_STYLES: Record<string, string> = {
    like_new:  'bg-emerald-50 text-emerald-700',
    excellent: 'bg-teal-50 text-teal-700',
    good:      'bg-blue-50 text-blue-700',
    fair:      'bg-amber-50 text-amber-700',
}

type SortKey = 'price' | 'viewCount' | 'createdAt' | 'batteryHealth'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

function fmtUSD(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n)
}

function relativeDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff < 7) return `${diff}d ago`
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`
    if (diff < 365) return `${Math.floor(diff / 30)}mo ago`
    return `${Math.floor(diff / 365)}y ago`
}

// ─────────────────────────────────────────────────────────────────
// SORT BUTTON
// ─────────────────────────────────────────────────────────────────
function SortBtn({
    col, current, dir, onSort, label,
}: {
    col: SortKey; current: SortKey; dir: SortDir
    onSort: (c: SortKey) => void; label: string
}) {
    const isActive = current === col
    return (
        <button
            onClick={() => onSort(col)}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-400
                hover:text-gray-700 uppercase tracking-wider transition-colors whitespace-nowrap"
        >
            {label}
            {isActive
                ? dir === 'asc'
                    ? <ChevronUpIcon className="w-3 h-3 text-teal-600" />
                    : <ChevronDownIcon className="w-3 h-3 text-teal-600" />
                : <ChevronUpDownIcon className="w-3 h-3" />
            }
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────
// LISTING THUMBNAIL
// ─────────────────────────────────────────────────────────────────
function ListingThumb({ listing, size = 'sm' }: { listing: AdminListing; size?: 'sm' | 'lg' }) {
    const sizeMap = { sm: 'w-10 h-10', lg: 'w-24 h-24' }
    const imgSize = size === 'sm' ? 40 : 96
    const imgSrc = listing.images?.[0]

    return (
        <div className={`${sizeMap[size]} rounded-xl bg-gray-50 border border-gray-100
            flex items-center justify-center overflow-hidden shrink-0`}>
            {imgSrc ? (
                <Image
                    src={imgSrc}
                    alt={listing.title}
                    width={imgSize}
                    height={imgSize}
                    sizes={`${imgSize}px`}
                    className="w-full h-full object-contain p-1"
                />
            ) : (
                <DevicePhoneMobileIcon className="w-5 h-5 text-gray-300" />
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// LISTING DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────
function ListingDrawer({
    listing,
    onClose,
    onUpdate,
    onDelete,
}: {
    listing: AdminListing
    onClose: () => void
    onUpdate: (id: string, updates: Partial<AdminListing>) => void
    onDelete: (id: string) => void
}) {
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    function showToast(msg: string, ok = true) {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    async function handleStatusChange(newStatus: ListingStatus) {
        setSaving(true)
        const result = await actionAdminUpdateListing(listing.id, { status: newStatus })
        setSaving(false)
        if (result.success) {
            onUpdate(listing.id, { status: newStatus })
            showToast(`Status changed to ${STATUS_LABELS[newStatus]}`)
        } else {
            showToast(result.error ?? 'Failed', false)
        }
    }

    async function handleToggleFeatured() {
        const next = !listing.isFeatured
        setSaving(true)
        const result = await actionAdminUpdateListing(listing.id, { is_featured: next })
        setSaving(false)
        if (result.success) {
            onUpdate(listing.id, { isFeatured: next })
            showToast(next ? 'Marked as Featured ✦' : 'Removed from Featured')
        } else {
            showToast(result.error ?? 'Failed', false)
        }
    }

    async function handleToggleVerified() {
        const next = !listing.isVerified
        setSaving(true)
        const result = await actionAdminUpdateListing(listing.id, { is_verified: next })
        setSaving(false)
        if (result.success) {
            onUpdate(listing.id, { isVerified: next })
            showToast(next ? 'Listing verified ✓' : 'Verification removed')
        } else {
            showToast(result.error ?? 'Failed', false)
        }
    }

    async function handleDelete() {
        if (!deleteConfirm) {
            setDeleteConfirm(true)
            setTimeout(() => setDeleteConfirm(false), 4000)
            return
        }
        setSaving(true)
        const result = await actionAdminDeleteListing(listing.id)
        setSaving(false)
        if (result.success) {
            onDelete(listing.id)
            onClose()
        } else {
            showToast(result.error ?? 'Delete failed', false)
            setDeleteConfirm(false)
        }
    }

    const discount = listing.originalPrice > listing.price
        ? Math.round((1 - listing.price / listing.originalPrice) * 100)
        : 0

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px] bg-white
                shadow-2xl overflow-y-auto animate-[slideInRight_.25s_ease_both]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100
                    sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
                            ${STATUS_STYLES[listing.status]}`}>
                            {STATUS_LABELS[listing.status]}
                        </span>
                        {listing.isFeatured && (
                            <span className="flex items-center gap-1 text-[10px] font-bold
                                bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                <StarSolid className="w-2.5 h-2.5" />
                                Featured
                            </span>
                        )}
                        {listing.isVerified && (
                            <span className="flex items-center gap-1 text-[10px] font-bold
                                bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                <ShieldSolid className="w-2.5 h-2.5" />
                                Verified
                            </span>
                        )}
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">

                    {/* Cover photo + identity */}
                    <div className="flex items-start gap-4">
                        <ListingThumb listing={listing} size="lg" />
                        <div className="flex-1 min-w-0">
                            {/* Brand */}
                            {listing.brandName && (
                                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">
                                    {listing.brandName}
                                </p>
                            )}
                            {/* Title */}
                            <h2 className="text-base font-bold text-gray-900 leading-snug mb-1">
                                {listing.title}
                            </h2>
                            {/* Category */}
                            {listing.categoryName && (
                                <p className="text-xs text-gray-400 mb-2">{listing.categoryName}</p>
                            )}
                            {/* ID */}
                            <p className="font-mono text-[10px] text-gray-300">
                                {listing.id.slice(0, 20)}…
                            </p>
                        </div>
                    </div>

                    {/* Price + condition row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl px-4 py-3">
                            <p className="text-lg font-black text-gray-900 leading-none">
                                {fmtUSD(listing.price)}
                            </p>
                            {discount > 0 && (
                                <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                                    {discount}% off retail
                                </p>
                            )}
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                Price
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl px-4 py-3">
                            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg mb-1
                                ${CONDITION_STYLES[listing.condition] ?? 'bg-gray-100 text-gray-600'}`}>
                                {CONDITION_LABELS[listing.condition] ?? listing.condition}
                            </span>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Condition
                            </p>
                        </div>
                    </div>

                    {/* Specs */}
                    <div className="flex flex-col gap-2">
                        {listing.storageCapacity && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Storage</span>
                                <span className="font-semibold text-gray-800">{listing.storageCapacity}</span>
                            </div>
                        )}
                        {listing.batteryHealth !== null && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Battery</span>
                                <span className={`font-semibold ${
                                    listing.batteryHealth >= 90 ? 'text-emerald-600' :
                                    listing.batteryHealth >= 80 ? 'text-amber-600' : 'text-red-500'
                                }`}>
                                    {listing.batteryHealth}%
                                </span>
                            </div>
                        )}
                        {listing.color && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Color</span>
                                <span className="font-semibold text-gray-800">{listing.color}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Views</span>
                            <span className="font-semibold text-gray-800">{listing.viewCount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Listed</span>
                            <span className="font-semibold text-gray-800">{relativeDate(listing.createdAt)}</span>
                        </div>
                    </div>

                    {/* IMEI status */}
                    {listing.imeiStatus && (
                        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border
                            ${listing.imeiStatus === 'clean'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                            {listing.imeiStatus === 'clean'
                                ? <ShieldSolid className="w-4 h-4 shrink-0" />
                                : <ShieldExclamationIcon className="w-4 h-4 shrink-0" />
                            }
                            <span className="text-sm font-semibold">
                                IMEI {listing.imeiStatus === 'clean' ? 'Clean — Not Blacklisted' : '⚠ Flagged'}
                            </span>
                        </div>
                    )}

                    {/* Seller */}
                    {listing.sellerUsername && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                                    Seller
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                    @{listing.sellerUsername}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {listing.sellerVerified === 'verified' && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold
                                        bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                        <ShieldSolid className="w-2.5 h-2.5" />
                                        Verified
                                    </span>
                                )}
                                {listing.sellerId && (
                                    <Link
                                        href={`/profile/${listing.sellerId}`}
                                        target="_blank"
                                        className="text-xs text-teal-600 hover:text-teal-800 font-semibold
                                            transition-colors"
                                    >
                                        View →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    <hr className="border-gray-100" />

                    {/* ── ADMIN ACTIONS ── */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            Moderation Actions
                        </h4>

                        {/* Status buttons */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                                Listing Status
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['active', 'inactive', 'pending_review', 'sold'] as ListingStatus[]).map(s => (
                                    <button
                                        key={s}
                                        disabled={saving || listing.status === s}
                                        onClick={() => handleStatusChange(s)}
                                        className={`py-2 rounded-xl text-xs font-bold border-2 transition-all
                                            disabled:cursor-default capitalize
                                            ${listing.status === s
                                                ? STATUS_STYLES[s] + ' border-current'
                                                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                            }`}
                                    >
                                        {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feature toggle */}
                        <button
                            disabled={saving}
                            onClick={handleToggleFeatured}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2
                                transition-all disabled:opacity-60 flex items-center justify-center gap-2
                                ${listing.isFeatured
                                    ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700'
                                }`}
                        >
                            <StarIcon className="w-4 h-4" />
                            {listing.isFeatured ? 'Remove from Featured' : '✦ Mark as Featured'}
                        </button>

                        {/* Verified toggle */}
                        <button
                            disabled={saving}
                            onClick={handleToggleVerified}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2
                                transition-all disabled:opacity-60 flex items-center justify-center gap-2
                                ${listing.isVerified
                                    ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                }`}
                        >
                            <ShieldCheckIcon className="w-4 h-4" />
                            {listing.isVerified ? '✗ Remove Verification' : '✓ Mark as Verified'}
                        </button>

                        {/* View public listing */}
                        <Link
                            href={`/devices/${listing.id}`}
                            target="_blank"
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                                text-sm font-semibold text-gray-600 border-2 border-gray-200
                                hover:border-teal-400 hover:text-teal-700 transition-all"
                        >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            View Public Listing
                        </Link>

                        {/* Delete — two-step confirm */}
                        <button
                            disabled={saving}
                            onClick={handleDelete}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2
                                transition-all disabled:opacity-60 flex items-center justify-center gap-2
                                ${deleteConfirm
                                    ? 'bg-red-600 border-red-600 text-white animate-pulse'
                                    : 'border-red-200 text-red-500 hover:bg-red-50'
                                }`}
                        >
                            <TrashIcon className="w-4 h-4" />
                            {deleteConfirm ? 'Confirm Delete (irreversible)' : 'Delete Listing'}
                        </button>
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-2xl
                        flex items-center gap-2 text-sm font-medium z-50
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
export default function ListingsTable({ listings: initialListings }: { listings: AdminListing[] }) {
    const [listings, setListings] = useState<AdminListing[]>(initialListings)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'sold' | 'pending_review'>('all')
    const [imeiFilter, setImeiFilter] = useState<'all' | 'clean' | 'flagged'>('all')
    const [conditionFilter, setConditionFilter] = useState<string>('all')
    const [sortKey, setSortKey] = useState<SortKey>('createdAt')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [page, setPage] = useState(1)
    const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null)

    function handleSort(col: SortKey) {
        if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(col); setSortDir('desc') }
        setPage(1)
    }

    // Optimistic update from drawer
    const handleUpdate = useCallback((id: string, updates: Partial<AdminListing>) => {
        setListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
        setSelectedListing(prev => prev?.id === id ? { ...prev, ...updates } : prev)
    }, [])

    // Remove from local state on delete
    const handleDelete = useCallback((id: string) => {
        setListings(prev => prev.filter(l => l.id !== id))
        setSelectedListing(null)
    }, [])

    // Filter + sort pipeline
    const filtered = useMemo(() => {
        let result = listings

        if (search.trim()) {
            const q = search.trim().toLowerCase()
            result = result.filter(l =>
                l.title.toLowerCase().includes(q) ||
                (l.brandName ?? '').toLowerCase().includes(q) ||
                (l.sellerUsername ?? '').toLowerCase().includes(q) ||
                (l.categoryName ?? '').toLowerCase().includes(q)
            )
        }

        if (statusFilter !== 'all')    result = result.filter(l => l.status === statusFilter)
        if (imeiFilter !== 'all')      result = result.filter(l => l.imeiStatus === imeiFilter)
        if (conditionFilter !== 'all') result = result.filter(l => l.condition === conditionFilter)

        result = [...result].sort((a, b) => {
            let av: number, bv: number
            if (sortKey === 'createdAt') {
                av = new Date(a.createdAt).getTime()
                bv = new Date(b.createdAt).getTime()
            } else {
                av = (a[sortKey] as number) ?? 0
                bv = (b[sortKey] as number) ?? 0
            }
            return sortDir === 'asc' ? av - bv : bv - av
        })

        return result
    }, [listings, search, statusFilter, imeiFilter, conditionFilter, sortKey, sortDir])

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Status tab counts
    const counts = useMemo(() => ({
        all:            listings.length,
        active:         listings.filter(l => l.status === 'active').length,
        inactive:       listings.filter(l => l.status === 'inactive').length,
        sold:           listings.filter(l => l.status === 'sold').length,
        pending_review: listings.filter(l => l.status === 'pending_review').length,
    }), [listings])

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
                            placeholder="Search by title, brand, seller, category…"
                            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                        />
                        {search && (
                            <button onClick={() => { setSearch(''); setPage(1) }}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* IMEI filter */}
                    <div className="flex items-center gap-1.5">
                        <FunnelIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <select
                            value={imeiFilter}
                            onChange={e => { setImeiFilter(e.target.value as typeof imeiFilter); setPage(1) }}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white
                                text-gray-700 outline-none focus:border-teal-400 cursor-pointer"
                        >
                            <option value="all">All IMEI</option>
                            <option value="clean">✓ IMEI Clean</option>
                            <option value="flagged">⚠ IMEI Flagged</option>
                        </select>
                    </div>

                    {/* Condition filter */}
                    <select
                        value={conditionFilter}
                        onChange={e => { setConditionFilter(e.target.value); setPage(1) }}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white
                            text-gray-700 outline-none focus:border-teal-400 cursor-pointer"
                    >
                        <option value="all">All conditions</option>
                        <option value="like_new">Like New</option>
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                    </select>
                </div>

                {/* ── Status tabs ── */}
                <div className="flex items-center gap-0 border-b border-gray-100 px-4 sm:px-5 overflow-x-auto">
                    {([
                        { id: 'all',            label: 'All Listings'   },
                        { id: 'active',         label: 'Active'         },
                        { id: 'pending_review', label: 'Pending Review' },
                        { id: 'inactive',       label: 'Inactive'       },
                        { id: 'sold',           label: 'Sold'           },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setStatusFilter(tab.id); setPage(1) }}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all
                                whitespace-nowrap -mb-px
                                ${statusFilter === tab.id
                                    ? 'border-teal-600 text-teal-800'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                ${statusFilter === tab.id
                                    ? 'bg-teal-100 text-teal-700'
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
                        </span>
                        {' '}of{' '}
                        <span className="font-semibold text-gray-800">{filtered.length}</span> listings
                        {search && <span className="text-gray-400"> matching &quot;{search}&quot;</span>}
                    </p>
                </div>

                {/* ── TABLE ── */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 sm:px-5 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Device
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Status / Flags
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Condition
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="price" current={sortKey} dir={sortDir} onSort={handleSort} label="Price" />
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="viewCount" current={sortKey} dir={sortDir} onSort={handleSort} label="Views" />
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
                                    <td colSpan={8} className="px-5 py-20 text-center">
                                        <DevicePhoneMobileIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400">
                                            No listings match your search or filters.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((listing, i) => (
                                    <tr
                                        key={listing.id}
                                        className={`border-b border-gray-50 hover:bg-gray-50/60
                                            transition-colors cursor-pointer
                                            ${i % 2 === 1 ? 'bg-gray-50/30' : ''}
                                            ${listing.imeiStatus === 'flagged' ? 'border-l-2 border-l-red-300' : ''}
                                            ${listing.status === 'pending_review' ? 'border-l-2 border-l-amber-400' : ''}
                                        `}
                                        onClick={() => setSelectedListing(listing)}
                                    >
                                        {/* Device cell */}
                                        <td className="px-4 sm:px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <ListingThumb listing={listing} size="sm" />
                                                <div className="min-w-0">
                                                    {listing.brandName && (
                                                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                                                            {listing.brandName}
                                                        </p>
                                                    )}
                                                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                                                        {listing.title}
                                                    </p>
                                                    {listing.storageCapacity && (
                                                        <p className="text-[11px] text-gray-400">
                                                            {listing.storageCapacity}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status + flags */}
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5
                                                    rounded-full w-fit ${STATUS_STYLES[listing.status]}`}>
                                                    {STATUS_LABELS[listing.status]}
                                                </span>
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {listing.isFeatured && (
                                                        <span className="flex items-center gap-0.5 text-[9px] font-bold
                                                            bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                                                            <StarSolid className="w-2 h-2" />
                                                            Featured
                                                        </span>
                                                    )}
                                                    {listing.isVerified && (
                                                        <span className="flex items-center gap-0.5 text-[9px] font-bold
                                                            bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                                            <ShieldSolid className="w-2 h-2" />
                                                            Verified
                                                        </span>
                                                    )}
                                                    {listing.imeiStatus === 'flagged' && (
                                                        <span className="flex items-center gap-0.5 text-[9px] font-bold
                                                            bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                                                            <ShieldExclamationIcon className="w-2.5 h-2.5" />
                                                            IMEI Flagged
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Condition */}
                                        <td className="px-3 py-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md
                                                ${CONDITION_STYLES[listing.condition] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {CONDITION_LABELS[listing.condition] ?? listing.condition}
                                            </span>
                                        </td>

                                        {/* Price */}
                                        <td className="px-3 py-3 text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                {fmtUSD(listing.price)}
                                            </p>
                                            {listing.originalPrice > listing.price && (
                                                <p className="text-[10px] text-amber-600 font-semibold">
                                                    -{Math.round((1 - listing.price / listing.originalPrice) * 100)}%
                                                </p>
                                            )}
                                        </td>

                                        {/* Views */}
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 text-sm text-gray-600">
                                                <EyeIcon className="w-3.5 h-3.5 text-gray-300" />
                                                {listing.viewCount.toLocaleString()}
                                            </div>
                                        </td>

                                        {/* Seller */}
                                        <td className="px-3 py-3">
                                            {listing.sellerUsername ? (
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700">
                                                        @{listing.sellerUsername}
                                                    </p>
                                                    {listing.sellerVerified === 'verified' && (
                                                        <p className="text-[9px] text-emerald-600 font-bold">
                                                            ✓ Verified seller
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
                                                {relativeDate(listing.createdAt)}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 sm:px-5 py-3 text-right">
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelectedListing(listing) }}
                                                className="text-xs font-semibold text-teal-700 hover:text-teal-900
                                                    bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg
                                                    transition-colors whitespace-nowrap"
                                            >
                                                Moderate
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
                    <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-t border-gray-100">
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
                                    <button key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                                            ${p === page
                                                ? 'bg-teal-700 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
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

            {/* ── Drawer ── */}
            {selectedListing && (
                <ListingDrawer
                    listing={selectedListing}
                    onClose={() => setSelectedListing(null)}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            )}
        </>
    )
}