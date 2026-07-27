'use client'

// src/components/admin/UserTable.tsx
// ─────────────────────────────────────────────────────────────────
// ADMIN USER TABLE — Interactive client component
//
// Features:
//   • Search by username / display name
//   • Filter by role (all / buyer / seller / admin)
//   • Filter by verification status
//   • Sort by any column (join date, sales, listings, rating)
//   • Pagination (50 per page)
//   • User detail drawer (slide-in panel)
//   • Change role action
//   • Verify / unverify seller action
// ─────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    XMarkIcon,
    StarIcon,
    TagIcon,
    ShoppingBagIcon,
    MapPinIcon,
    CalendarDaysIcon,
    ArrowTopRightOnSquareIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline'
import { ShieldCheckIcon as ShieldSolid } from '@heroicons/react/24/solid'
import type { AdminUser } from '@/app/admin/users/page'
import { actionAdminUpdateUser } from '@/actions/adminUsers'

// ── Avatar gradient pool ──────────────────────────────────────────
const GRADIENTS = [
    'from-teal-500 to-emerald-500',
    'from-violet-500 to-purple-500',
    'from-orange-500 to-red-500',
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
]
function pickGradient(seed: string) {
    return GRADIENTS[seed.charCodeAt(0) % GRADIENTS.length]
}
function toInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Sort config ───────────────────────────────────────────────────
type SortKey = 'createdAt' | 'totalSales' | 'listingCount' | 'sellerRating' | 'buyerOrderCount'
type SortDir = 'asc' | 'desc'

// ── Role pill styles ──────────────────────────────────────────────
const ROLE_STYLES: Record<string, string> = {
    admin:  'bg-red-100 text-red-700',
    seller: 'bg-teal-100 text-teal-700',
    buyer:  'bg-gray-100 text-gray-600',
}

// ── Verification pill ─────────────────────────────────────────────
function VerifiedPill({ verified }: { verified: string | null }) {
    if (verified === 'verified') {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold
                bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                <ShieldSolid className="w-2.5 h-2.5" />
                Verified
            </span>
        )
    }
    if (verified === 'pending') {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold
                bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                <ExclamationTriangleIcon className="w-2.5 h-2.5" />
                Pending
            </span>
        )
    }
    return null
}

// ── User avatar ───────────────────────────────────────────────────
function UserAvatar({ user, size = 'sm' }: { user: AdminUser; size?: 'sm' | 'md' | 'lg' }) {
    const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }
    const cls = sizeMap[size]
    const displayName = user.fullName ?? user.username

    if (user.avatarUrl) {
        return (
            <div className={`${cls} rounded-full overflow-hidden shrink-0`}>
                <Image src={user.avatarUrl} alt={displayName}
                    width={56} height={56} sizes="56px"
                    className="w-full h-full object-cover" />
            </div>
        )
    }
    return (
        <div className={`${cls} rounded-full bg-gradient-to-br ${pickGradient(user.id)}
            flex items-center justify-center text-white font-bold shrink-0`}>
            {toInitials(displayName)}
        </div>
    )
}

// ── Relative date ─────────────────────────────────────────────────
function relativeDate(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff < 7) return `${diff}d ago`
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`
    if (diff < 365) return `${Math.floor(diff / 30)}mo ago`
    return `${Math.floor(diff / 365)}y ago`
}

// ─────────────────────────────────────────────────────────────────
// USER DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────
function UserDrawer({
    user,
    onClose,
    onUpdate,
}: {
    user: AdminUser
    onClose: () => void
    onUpdate: (id: string, updates: Partial<AdminUser>) => void
}) {
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<string | null>(null)

    function showToast(msg: string) {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    async function handleRoleChange(newRole: AdminUser['role']) {
        setSaving(true)
        const result = await actionAdminUpdateUser(user.id, { role: newRole })
        setSaving(false)
        if (result.success) {
            onUpdate(user.id, { role: newRole })
            showToast(`Role updated to ${newRole}`)
        } else {
            showToast(result.error ?? 'Failed to update role')
        }
    }

    async function handleVerifyToggle() {
        const newVerified = user.verified === 'verified' ? null : 'verified'
        setSaving(true)
        const result = await actionAdminUpdateUser(user.id, { verified: newVerified })
        setSaving(false)
        if (result.success) {
            onUpdate(user.id, { verified: newVerified })
            showToast(newVerified === 'verified' ? 'Seller verified!' : 'Verification removed')
        } else {
            showToast(result.error ?? 'Failed to update verification')
        }
    }

    const displayName = user.fullName ?? user.username
    const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    })

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-white
                shadow-2xl overflow-y-auto animate-[slideInRight_.25s_ease_both]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="text-sm font-bold text-gray-900">User Detail</h3>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">

                    {/* User identity */}
                    <div className="flex items-start gap-4">
                        <UserAvatar user={user} size="lg" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <h2 className="text-base font-bold text-gray-900 truncate">
                                    {displayName}
                                </h2>
                                <VerifiedPill verified={user.verified} />
                            </div>
                            <p className="text-sm text-gray-400">@{user.username}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                                    uppercase tracking-wide ${ROLE_STYLES[user.role]}`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Devices Sold',  value: user.totalSales,      icon: TagIcon         },
                            { label: 'Seller Rating', value: user.sellerRating > 0 ? `${user.sellerRating.toFixed(1)} ★` : '—', icon: StarIcon },
                            { label: 'Listings',      value: user.listingCount,     icon: TagIcon         },
                            { label: 'Purchases',     value: user.buyerOrderCount,  icon: ShoppingBagIcon },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-lg font-black text-gray-900 leading-none mb-0.5">
                                    {value}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-col gap-2.5">
                        {user.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPinIcon className="w-4 h-4 text-gray-300 shrink-0" />
                                {user.location}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CalendarDaysIcon className="w-4 h-4 text-gray-300 shrink-0" />
                            Joined {joinDate}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <UserCircleIcon className="w-4 h-4 text-gray-300 shrink-0" />
                            ID: <span className="font-mono text-xs text-gray-400">{user.id.slice(0, 16)}…</span>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* ── ADMIN ACTIONS ── */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            Admin Actions
                        </h4>

                        {/* Role selector */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                                User Role
                            </label>
                            <div className="flex gap-2">
                                {(['buyer', 'seller', 'admin'] as const).map(r => (
                                    <button
                                        key={r}
                                        disabled={saving || user.role === r}
                                        onClick={() => handleRoleChange(r)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize
                                            border-2 transition-all disabled:cursor-default
                                            ${user.role === r
                                                ? ROLE_STYLES[r] + ' border-current'
                                                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Verify toggle */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                                Seller Verification
                            </label>
                            <button
                                disabled={saving}
                                onClick={handleVerifyToggle}
                                className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2
                                    transition-all disabled:opacity-60 disabled:cursor-wait
                                    ${user.verified === 'verified'
                                        ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                        : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                    }`}
                            >
                                {saving ? 'Saving…' : user.verified === 'verified'
                                    ? '✗ Remove Verification'
                                    : '✓ Mark as Verified Seller'
                                }
                            </button>
                        </div>

                        {/* View profile link */}
                        <Link
                            href={`/profile/${user.id}`}
                            target="_blank"
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                                text-sm font-semibold text-gray-600 border-2 border-gray-200
                                hover:border-teal-400 hover:text-teal-700 transition-all"
                        >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            View Public Profile
                        </Link>
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-4 py-3
                        rounded-xl text-sm font-medium shadow-2xl flex items-center gap-2
                        animate-[fadeUp_.3s_ease_both]">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                        {toast}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </>
    )
}

// ─────────────────────────────────────────────────────────────────
// SORT BUTTON
// ─────────────────────────────────────────────────────────────────
function SortBtn({
    col, current, dir, onSort, label,
}: {
    col: SortKey
    current: SortKey
    dir: SortDir
    onSort: (col: SortKey) => void
    label: string
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
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50

export default function UserTable({ users: initialUsers }: { users: AdminUser[] }) {
    // ── Local state mirrors server data for optimistic updates ────
    const [users, setUsers] = useState<AdminUser[]>(initialUsers)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'admin'>('all')
    const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'pending' | 'unverified'>('all')
    const [sortKey, setSortKey] = useState<SortKey>('createdAt')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [page, setPage] = useState(1)
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

    // ── Sort handler ──────────────────────────────────────────────
    function handleSort(col: SortKey) {
        if (sortKey === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(col)
            setSortDir('desc')
        }
        setPage(1)
    }

    // ── Optimistic update from drawer ─────────────────────────────
    const handleUpdate = useCallback((id: string, updates: Partial<AdminUser>) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
        setSelectedUser(prev => prev?.id === id ? { ...prev, ...updates } : prev)
    }, [])

    // ── Filter + sort pipeline ────────────────────────────────────
    const filtered = useMemo(() => {
        let result = users

        // Search
        if (search.trim()) {
            const q = search.trim().toLowerCase()
            result = result.filter(u =>
                u.username.toLowerCase().includes(q) ||
                (u.fullName ?? '').toLowerCase().includes(q)
            )
        }

        // Role filter
        if (roleFilter !== 'all') {
            result = result.filter(u => u.role === roleFilter)
        }

        // Verification filter
        if (verifiedFilter === 'verified') {
            result = result.filter(u => u.verified === 'verified')
        } else if (verifiedFilter === 'pending') {
            result = result.filter(u => u.verified === 'pending')
        } else if (verifiedFilter === 'unverified') {
            result = result.filter(u => !u.verified)
        }

        // Sort
        result = [...result].sort((a, b) => {
            let av: number, bv: number
            if (sortKey === 'createdAt') {
                av = new Date(a.createdAt).getTime()
                bv = new Date(b.createdAt).getTime()
            } else {
                av = a[sortKey] as number
                bv = b[sortKey] as number
            }
            return sortDir === 'asc' ? av - bv : bv - av
        })

        return result
    }, [users, search, roleFilter, verifiedFilter, sortKey, sortDir])

    // ── Pagination ────────────────────────────────────────────────
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Summary counts for the filter tabs
    const counts = useMemo(() => ({
        all:    users.length,
        buyer:  users.filter(u => u.role === 'buyer').length,
        seller: users.filter(u => u.role === 'seller').length,
        admin:  users.filter(u => u.role === 'admin').length,
    }), [users])

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
                            placeholder="Search by username or name…"
                            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                        />
                        {search && (
                            <button onClick={() => { setSearch(''); setPage(1) }}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Verification filter */}
                    <div className="flex items-center gap-1.5">
                        <FunnelIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <select
                            value={verifiedFilter}
                            onChange={e => { setVerifiedFilter(e.target.value as typeof verifiedFilter); setPage(1) }}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white
                                text-gray-700 outline-none focus:border-teal-400 cursor-pointer"
                        >
                            <option value="all">All verification</option>
                            <option value="verified">✓ Verified</option>
                            <option value="pending">⏳ Pending</option>
                            <option value="unverified">— Unverified</option>
                        </select>
                    </div>
                </div>

                {/* ── Role filter tabs ── */}
                <div className="flex items-center gap-0 border-b border-gray-100 px-4 sm:px-5 overflow-x-auto">
                    {(['all', 'buyer', 'seller', 'admin'] as const).map(role => (
                        <button
                            key={role}
                            onClick={() => { setRoleFilter(role); setPage(1) }}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all
                                whitespace-nowrap -mb-px capitalize
                                ${roleFilter === role
                                    ? 'border-teal-600 text-teal-800'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {role === 'all' ? 'All Users' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
                            <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                ${roleFilter === role
                                    ? 'bg-teal-100 text-teal-700'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                {counts[role]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Result count ── */}
                <div className="px-4 sm:px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-500">
                        Showing <span className="font-semibold text-gray-800">
                            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}
                        </span> of <span className="font-semibold text-gray-800">{filtered.length}</span> users
                        {search && <span className="text-gray-400"> matching &quot;{search}&quot;</span>}
                    </p>
                </div>

                {/* ── TABLE ── */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 sm:px-5 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        User
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-left">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        Role / Status
                                    </span>
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="listingCount" current={sortKey} dir={sortDir} onSort={handleSort} label="Listings" />
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="totalSales" current={sortKey} dir={sortDir} onSort={handleSort} label="Sales" />
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="sellerRating" current={sortKey} dir={sortDir} onSort={handleSort} label="Rating" />
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="buyerOrderCount" current={sortKey} dir={sortDir} onSort={handleSort} label="Purchases" />
                                </th>
                                <th className="px-3 py-3 text-right">
                                    <SortBtn col="createdAt" current={sortKey} dir={sortDir} onSort={handleSort} label="Joined" />
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
                                        <p className="text-sm text-gray-400">
                                            No users match your search or filters.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((user, i) => (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-gray-50 hover:bg-gray-50/60
                                            transition-colors cursor-pointer
                                            ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        {/* User identity cell */}
                                        <td className="px-4 sm:px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar user={user} size="sm" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate
                                                        max-w-[140px]">
                                                        {user.fullName ?? user.username}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 truncate">
                                                        @{user.username}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role / verified */}
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5
                                                    rounded-full w-fit capitalize
                                                    ${ROLE_STYLES[user.role]}`}>
                                                    {user.role}
                                                </span>
                                                <VerifiedPill verified={user.verified} />
                                            </div>
                                        </td>

                                        {/* Listings */}
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {user.listingCount}
                                            </span>
                                        </td>

                                        {/* Sales */}
                                        <td className="px-3 py-3 text-right">
                                            <span className={`text-sm font-semibold
                                                ${user.totalSales > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                {user.totalSales}
                                            </span>
                                        </td>

                                        {/* Rating */}
                                        <td className="px-3 py-3 text-right">
                                            {user.sellerRating > 0 ? (
                                                <span className="text-sm font-semibold text-amber-600">
                                                    {user.sellerRating.toFixed(1)} ★
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-300">—</span>
                                            )}
                                        </td>

                                        {/* Purchases */}
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {user.buyerOrderCount}
                                            </span>
                                        </td>

                                        {/* Joined */}
                                        <td className="px-3 py-3 text-right">
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {relativeDate(user.createdAt)}
                                            </span>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 sm:px-5 py-3 text-right">
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelectedUser(user) }}
                                                className="text-xs font-semibold text-teal-700 hover:text-teal-900
                                                    bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg
                                                    transition-colors whitespace-nowrap"
                                            >
                                                View
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
                        <p className="text-xs text-gray-400">
                            Page {page} of {totalPages}
                        </p>
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
                                if (totalPages <= 5)          p = i + 1
                                else if (page <= 3)           p = i + 1
                                else if (page >= totalPages - 2) p = totalPages - 4 + i
                                else                          p = page - 2 + i
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

            {/* ── Detail Drawer ── */}
            {selectedUser && (
                <UserDrawer
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onUpdate={handleUpdate}
                />
            )}
        </>
    )
}