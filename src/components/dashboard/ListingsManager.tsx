'use client'

// src/components/dashboard/ListingsManager.tsx
// ─────────────────────────────────────────────────────────────────
// LISTINGS MANAGER — Client Component
//
// Receives all seller listings from the server page and handles:
//   • Status tab filtering (All / Active / Sold / Inactive)
//   • Deactivate  → actionDeleteDevice()   sets status = 'inactive'
//   • Reactivate  → actionUpdateDevice()   sets status = 'active'
//   • Two-step confirm before any destructive action
//
// No data fetching here — everything is passed via props so the
// initial render is instant (server already fetched it all).
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    TagIcon,
    PlusIcon,
    EyeIcon,
    ArrowPathIcon,
    XCircleIcon,
    CheckCircleIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { actionDeleteDevice, actionUpdateDevice } from '@/actions/device'

// ── Types ─────────────────────────────────────────────────────────

// Shape returned by getSellerDevices() in deviceWriteService.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SellerListing = Record<string, any>

interface ListingsManagerProps {
    listings: SellerListing[]
}

// ── Constants ─────────────────────────────────────────────────────

// Status values that come from the Supabase products table
type StatusFilter = 'all' | 'active' | 'sold' | 'inactive' | 'pending_review'

const TABS: { id: StatusFilter; label: string }[] = [
    { id: 'all',            label: 'All'            },
    { id: 'active',         label: 'Active'         },
    { id: 'sold',           label: 'Sold'           },
    { id: 'inactive',       label: 'Inactive'       },
    { id: 'pending_review', label: 'Pending Review' },
]

// Maps DB condition strings → display labels
const CONDITION_LABEL: Record<string, string> = {
    like_new:  'Like New',
    excellent: 'Excellent',
    good:      'Good',
    fair:      'Fair',
}

// Status pill colours
const STATUS_PILL: Record<string, string> = {
    active:         'bg-emerald-100 text-emerald-700',
    sold:           'bg-blue-100 text-blue-700',
    inactive:       'bg-gray-100 text-gray-500',
    pending_review: 'bg-amber-100 text-amber-700',
}

// Human-readable status labels
const STATUS_LABEL: Record<string, string> = {
    active:         'Active',
    sold:           'Sold',
    inactive:       'Inactive',
    pending_review: 'Pending Review',
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function ListingsManager({ listings }: ListingsManagerProps) {

    // ── Tab state ─────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<StatusFilter>('all')

    // ── Confirm state — stores the deviceId being confirmed ───────
    // Pattern: first click → set confirmId; second click → run action
    const [confirmId, setConfirmId] = useState<string | null>(null)

    // ── Toast notification ────────────────────────────────────────
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

    // useTransition gives us a pending flag for async actions without
    // blocking the UI. Each listing card tracks its own loading state
    // via loadingId.
    const [, startTransition] = useTransition()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    // ── Derived: count per status for tab badges ──────────────────
    const counts = listings.reduce<Record<string, number>>((acc, l) => {
        const s = String(l.status ?? 'active')
        acc[s] = (acc[s] ?? 0) + 1
        return acc
    }, {})

    // ── Filter listings by active tab ─────────────────────────────
    const visible = activeTab === 'all'
        ? listings
        : listings.filter(l => l.status === activeTab)

    // ── Toast helper ──────────────────────────────────────────────
    function showToast(msg: string, ok = true) {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    // ── DEACTIVATE — sets status = 'inactive' ────────────────────
    // Uses the existing actionDeleteDevice (soft-delete in the codebase).
    const handleDeactivate = useCallback((deviceId: string) => {
        // First click: show confirm prompt
        if (confirmId !== deviceId) {
            setConfirmId(deviceId)
            // Auto-reset after 4 s so it doesn't get stuck
            setTimeout(() => setConfirmId(null), 4000)
            return
        }

        // Second click: confirmed — run the action
        setConfirmId(null)
        setLoadingId(deviceId)

        startTransition(async () => {
            const result = await actionDeleteDevice(deviceId)
            setLoadingId(null)
            if (result.success) {
                showToast('Listing deactivated — it's now hidden from buyers.')
            } else {
                showToast(result.error ?? 'Something went wrong.', false)
            }
        })
    }, [confirmId])

    // ── REACTIVATE — sets status = 'active' ──────────────────────
    // actionUpdateDevice accepts a partial FormData; only the status
    // field needs to be set to bring a listing back online.
    const handleReactivate = useCallback((deviceId: string) => {
        setLoadingId(deviceId)

        startTransition(async () => {
            const fd = new FormData()
            fd.set('status', 'active')
            const result = await actionUpdateDevice(deviceId, fd)
            setLoadingId(null)
            if (result.success) {
                showToast('Listing is live again! Buyers can now see it.')
            } else {
                showToast(result.error ?? 'Something went wrong.', false)
            }
        })
    }, [])

    // ── Cancel any pending confirm ────────────────────────────────
    const cancelConfirm = useCallback(() => setConfirmId(null), [])

    // ─────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── PAGE HEADER ── */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Listings</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {listings.length} device{listings.length !== 1 ? 's' : ''} total
                    </p>
                </div>
                <Link
                    href="/sell"
                    className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                        text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                        transition-all hover:-translate-y-0.5 hover:shadow-md shrink-0"
                >
                    <PlusIcon className="w-4 h-4" />
                    Add New Listing
                </Link>
            </div>

            {/* ── STATUS TABS — horizontal scroll on mobile ─────── */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-5 scrollbar-none">
                {TABS.map(tab => {
                    // Don't show tabs for statuses with 0 listings (except 'all')
                    if (tab.id !== 'all' && !counts[tab.id] && activeTab !== tab.id) return null

                    const count = tab.id === 'all' ? listings.length : (counts[tab.id] ?? 0)
                    const isActive = activeTab === tab.id

                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id)
                                setConfirmId(null)
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                                font-semibold whitespace-nowrap transition-all duration-150 shrink-0
                                ${isActive
                                    ? 'bg-teal-800 text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-700'
                                }`}
                        >
                            {tab.label}
                            {count > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                    ${isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ── LISTINGS ─────────────────────────────────────── */}
            {visible.length === 0 ? (
                /* Empty state for the active tab */
                <div className="bg-white rounded-2xl border border-dashed border-gray-200
                    p-14 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center
                        justify-center mb-4">
                        <TagIcon className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-700 mb-1">
                        No {activeTab === 'all' ? '' : activeTab.replace('_', ' ')} listings
                    </p>
                    <p className="text-sm text-gray-400 mb-5 max-w-xs leading-relaxed">
                        {activeTab === 'all'
                            ? "You haven't listed any devices yet. Start selling in minutes!"
                            : `You have no ${activeTab.replace('_', ' ')} listings right now.`
                        }
                    </p>
                    {activeTab === 'all' && (
                        <Link href="/sell"
                            className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                                text-white font-semibold px-5 py-2.5 rounded-xl text-sm
                                transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <PlusIcon className="w-4 h-4" />
                            List Your First Device
                        </Link>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {visible.map((listing, i) => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            loadingId={loadingId}
                            confirmId={confirmId}
                            onDeactivate={handleDeactivate}
                            onReactivate={handleReactivate}
                            onCancelConfirm={cancelConfirm}
                            animationDelay={i * 40}
                        />
                    ))}
                </div>
            )}

            {/* ── TOAST ────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed bottom-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-2xl
                    flex items-center gap-3 text-sm font-medium
                    animate-[fadeUp_.3s_ease_both]
                    ${toast.ok ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.ok
                        ? <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                        : <XCircleIcon className="w-5 h-5 text-red-200 shrink-0" />
                    }
                    {toast.msg}
                </div>
            )}
        </>
    )
}

// ─────────────────────────────────────────────────────────────────
// LISTING CARD — one row per device
// ─────────────────────────────────────────────────────────────────
interface ListingCardProps {
    listing:         SellerListing
    loadingId:       string | null
    confirmId:       string | null
    onDeactivate:    (id: string) => void
    onReactivate:    (id: string) => void
    onCancelConfirm: () => void
    animationDelay:  number
}

function ListingCard({
    listing,
    loadingId,
    confirmId,
    onDeactivate,
    onReactivate,
    onCancelConfirm,
    animationDelay,
}: ListingCardProps) {
    const id         = String(listing.id)
    const status     = String(listing.status ?? 'active')
    const isLoading  = loadingId === id
    const isConfirm  = confirmId === id
    const imgSrc     = Array.isArray(listing.images) ? listing.images[0] : null
    const brand      = listing.brand?.name ?? '—'
    const price      = Number(listing.price ?? 0)
    const origPrice  = Number(listing.original_price ?? 0)
    const discount   = origPrice > price ? Math.round((1 - price / origPrice) * 100) : 0
    const condition  = CONDITION_LABEL[listing.condition] ?? listing.condition ?? '—'
    const storage    = listing.storage_capacity ?? '—'
    const views      = listing.view_count ?? 0
    const createdAt  = listing.created_at
        ? new Date(listing.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })
        : '—'

    return (
        <div
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden
                transition-all duration-200
                animate-[fadeUp_.35s_ease_both]
                ${isConfirm
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-100 hover:border-teal-200 hover:shadow-md'
                }`}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            {/* Main card content */}
            <div className="p-4 flex items-start gap-4">

                {/* ── Thumbnail ── */}
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-gray-50 border border-gray-100
                    flex items-center justify-center shrink-0 overflow-hidden">
                    {imgSrc ? (
                        <Image
                            src={imgSrc}
                            alt={listing.title ?? 'Device'}
                            width={80} height={80}
                            className="w-full h-full object-contain p-1"
                            unoptimized
                        />
                    ) : (
                        <span className="text-3xl select-none">📱</span>
                    )}
                </div>

                {/* ── Main info ── */}
                <div className="flex-1 min-w-0">
                    {/* Status + condition + date row */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                            ${STATUS_PILL[status] ?? STATUS_PILL.active}`}>
                            {STATUS_LABEL[status] ?? status}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {condition}
                        </span>
                        <span className="text-[10px] text-gray-400 hidden sm:inline">
                            Listed {createdAt}
                        </span>
                    </div>

                    {/* Brand */}
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">
                        {brand}
                    </p>

                    {/* Title */}
                    <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                        {listing.title ?? '—'}
                    </p>

                    {/* Storage + price row */}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">{storage}</span>
                        <span className="text-sm font-bold text-gray-900">
                            ${price.toLocaleString()}
                        </span>
                        {discount > 0 && (
                            <span className="text-xs text-gray-400 line-through">
                                ${origPrice.toLocaleString()}
                            </span>
                        )}
                        {discount > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50
                                px-1.5 py-0.5 rounded">
                                -{discount}%
                            </span>
                        )}
                    </div>

                    {/* Views + featured badge */}
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <EyeIcon className="w-3.5 h-3.5" />
                            {views} view{views !== 1 ? 's' : ''}
                        </span>
                        {listing.is_featured && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50
                                px-2 py-0.5 rounded-full">
                                ✦ Featured
                            </span>
                        )}
                        {listing.is_verified && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50
                                px-2 py-0.5 rounded-full">
                                ✓ Verified
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Action buttons — desktop: column on right ── */}
                {/* Mobile: these move below via the ActionRow component */}
                <div className="hidden sm:flex flex-col gap-2 shrink-0 items-end">
                    <ActionButtons
                        id={id}
                        status={status}
                        isLoading={isLoading}
                        isConfirm={isConfirm}
                        onDeactivate={onDeactivate}
                        onReactivate={onReactivate}
                        onCancelConfirm={onCancelConfirm}
                    />
                </div>
            </div>

            {/* ── Mobile action row (below card content) ── */}
            <div className="sm:hidden border-t border-gray-100 px-4 py-3 flex items-center
                justify-between gap-3">
                <Link
                    href={`/devices/${id}`}
                    className="flex-1 flex items-center justify-center gap-1.5
                        text-xs font-semibold text-gray-600 hover:text-teal-700
                        py-2 rounded-xl border border-gray-200 hover:border-teal-400
                        transition-all"
                >
                    <EyeIcon className="w-3.5 h-3.5" />
                    View
                </Link>
                <div className="flex-1 flex justify-center">
                    <ActionButtons
                        id={id}
                        status={status}
                        isLoading={isLoading}
                        isConfirm={isConfirm}
                        onDeactivate={onDeactivate}
                        onReactivate={onReactivate}
                        onCancelConfirm={onCancelConfirm}
                        isMobile
                    />
                </div>
            </div>

            {/* ── Confirm banner — slides in above actions ── */}
            {isConfirm && (
                <div className="bg-red-50 border-t border-red-200 px-4 py-3 flex items-center
                    justify-between gap-3 animate-[fadeDown_.2s_ease_both]">
                    <p className="text-xs font-semibold text-red-700">
                        This will hide the listing from buyers. Confirm?
                    </p>
                    <button
                        onClick={onCancelConfirm}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium shrink-0"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// ACTION BUTTONS — shared between desktop sidebar + mobile row
// ─────────────────────────────────────────────────────────────────
interface ActionButtonsProps {
    id:              string
    status:          string
    isLoading:       boolean
    isConfirm:       boolean
    onDeactivate:    (id: string) => void
    onReactivate:    (id: string) => void
    onCancelConfirm: () => void
    isMobile?:       boolean
}

function ActionButtons({
    id, status, isLoading, isConfirm,
    onDeactivate, onReactivate, isMobile = false,
}: ActionButtonsProps) {
    const btnBase = isMobile
        ? 'flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all w-full'
        : 'flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all min-w-[96px]'

    if (isLoading) {
        return (
            <div className={`${btnBase} bg-gray-100 text-gray-400 cursor-wait`}>
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                {!isMobile && 'Updating…'}
            </div>
        )
    }

    return (
        <div className={isMobile ? 'flex gap-2 w-full' : 'flex flex-col gap-2'}>
            {/* View — always shown */}
            {!isMobile && (
                <Link
                    href={`/devices/${id}`}
                    className={`${btnBase} border border-gray-200 text-gray-500
                        hover:border-teal-400 hover:text-teal-700`}
                >
                    <EyeIcon className="w-3.5 h-3.5" />
                    View
                    <ChevronRightIcon className="w-3 h-3" />
                </Link>
            )}

            {/* Active → Deactivate button */}
            {status === 'active' && (
                <button
                    onClick={() => onDeactivate(id)}
                    className={`${btnBase} ${
                        isConfirm
                            ? 'bg-red-500 text-white border-red-500 shadow-sm'
                            : 'border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400'
                    }`}
                >
                    <XCircleIcon className="w-3.5 h-3.5" />
                    {isConfirm ? 'Confirm Deactivate' : 'Deactivate'}
                </button>
            )}

            {/* Inactive → Reactivate button */}
            {status === 'inactive' && (
                <button
                    onClick={() => onReactivate(id)}
                    className={`${btnBase} bg-teal-50 border border-teal-300 text-teal-800
                        hover:bg-teal-100 hover:border-teal-500`}
                >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    Reactivate
                </button>
            )}

            {/* Sold / pending → no action available */}
            {(status === 'sold' || status === 'pending_review') && (
                <span className={`${btnBase} bg-gray-50 border border-gray-100 text-gray-400 cursor-default`}>
                    {status === 'sold' ? '✓ Sold' : '⏳ Pending'}
                </span>
            )}
        </div>
    )
}