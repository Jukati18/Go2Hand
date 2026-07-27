'use client';

// ============================================
// WATCHLIST PAGE — /watchlist
//
// Features:
//  • Fetches saved devices via getWatchlist() server action
//  • Optimistic remove (instant UI update, server confirms)
//  • Sort: Recently Saved / Price Low→High / Price High→Low
//  • Bulk "Clear All" with confirmation
//  • Empty state with CTA to browse
//  • Toast notifications
//  • Loading skeleton grid
//  • Item count in header
// ============================================

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    HeartIcon,
    TrashIcon,
    ArrowsUpDownIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WatchlistCard, { type WatchlistEntry } from '@/components/watchlist/WatchlistCard';
import { getWatchlist, actionRemoveFromWatchlist } from '@/actions/watchlist';

// ── Sort options ──────────────────────────────────────────────────
const SORTS = [
    { label: 'Recently Saved', value: 'date' },
    { label: 'Price: Low → High', value: 'price_asc' },
    { label: 'Price: High → Low', value: 'price_desc' },
    { label: 'Biggest Discount', value: 'discount' },
];

// ─────────────────────────────────────────────────────────────────
export default function WatchlistPage() {
    const [entries, setEntries]     = useState<WatchlistEntry[]>([]);
    const [loading, setLoading]     = useState(true);
    const [sortBy, setSortBy]       = useState('date');
    const [toast, setToast]         = useState<{ msg: string; type?: 'ok' | 'err' } | null>(null);
    const [confirming, setConfirming] = useState(false); // "clear all" confirmation state

    // ── Fetch on mount ────────────────────────────────────────────
    useEffect(() => {
        getWatchlist()
            // getWatchlist returns a typed array, cast to our local type
            .then((data) => setEntries(data as unknown as WatchlistEntry[]))
            .catch(() => setEntries([]))
            .finally(() => setLoading(false));
    }, []);

    // ── Toast helper ──────────────────────────────────────────────
    function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 2600);
    }

    // ── Remove one device ─────────────────────────────────────────
    const handleRemove = useCallback(async (productId: string) => {
        // Optimistic: remove from local state immediately
        setEntries((prev) => prev.filter((e) => e.product?.id !== productId));

        const result = await actionRemoveFromWatchlist(productId);
        if (!result.success) {
            showToast(result.error ?? 'Could not remove — try again', 'err');
            // Re-fetch to restore correct state on failure
            getWatchlist().then((data) => setEntries(data as unknown as WatchlistEntry[]));
        } else {
            showToast('Removed from watchlist');
        }
    }, []);

    // ── Clear all ─────────────────────────────────────────────────
    const handleClearAll = useCallback(async () => {
        if (!confirming) {
            // First click → show confirm state for 3 s
            setConfirming(true);
            setTimeout(() => setConfirming(false), 3000);
            return;
        }
        // Second click within 3 s → actually clear
        setConfirming(false);
        const toRemove = [...entries];
        setEntries([]); // optimistic
        await Promise.all(
            toRemove.map((e) =>
                e.product?.id ? actionRemoveFromWatchlist(e.product.id) : Promise.resolve()
            )
        );
        showToast('Watchlist cleared');
    }, [confirming, entries]);

    // ── Sort entries client-side ───────────────────────────────────
     
    const sorted = [...entries].sort((a, b): number => {
        const pa = a.product;
        const pb = b.product;
        if (sortBy === 'price_asc')
            return (pa?.price ?? 0) - (pb?.price ?? 0);
        if (sortBy === 'price_desc')
            return (pb?.price ?? 0) - (pa?.price ?? 0);
        if (sortBy === 'discount') {
            const da = pa ? Math.round((1 - pa.price / pa.original_price) * 100) : 0;
            const db = pb ? Math.round((1 - pb.price / pb.original_price) * 100) : 0;
            return db - da;
        }
        // 'date' — most recently saved first (default)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // ── Derived stats ──────────────────────────────────────────────
    const totalSaved   = entries.length;
    const totalValue   = entries.reduce((sum, e) => sum + (e.product?.price ?? 0), 0);
    const totalSavings = entries.reduce((sum, e) => {
        const p = e.product;
        return sum + (p && p.original_price > p.price ? p.original_price - p.price : 0);
    }, 0);

    return (
        <div className="min-h-screen bg-[#F4F2EE]">
            <Navbar />
 
            <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
 
                {/* ── PAGE HEADER ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-xl sm:text-2xl font-bold text-gray-900">
                            <HeartSolid className="w-6 h-6 text-red-500" />
                            My Watchlist
                            {!loading && totalSaved > 0 && (
                                <span className="text-base font-normal text-gray-400">({totalSaved})</span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">Devices you&apos;re keeping an eye on</p>
                    </div>
 
                    {!loading && totalSaved > 0 && (
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            {/* Sort selector */}
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-1 sm:flex-none">
                                <ArrowsUpDownIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer w-full sm:w-auto">
                                    {SORTS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
 
                            {/* Clear all */}
                            <button onClick={handleClearAll}
                                className={`flex items-center gap-1.5 text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl border-2 transition-all duration-200 shrink-0
                                    ${confirming
                                        ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                                        : 'bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'}`}>
                                <TrashIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{confirming ? 'Tap again to confirm' : 'Clear all'}</span>
                            </button>
                        </div>
                    )}
                </div>
 
                {/* ── STATS BANNER — 1-col mobile → 3-col sm ── */}
                {!loading && totalSaved > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                        {[
                            { label: 'Items saved',    value: totalSaved.toString(),                                     icon: '❤️',  highlight: false },
                            { label: 'Total value',    value: `$${totalValue.toLocaleString()}`,                         icon: '💰',  highlight: false },
                            { label: "You're saving",  value: totalSavings > 0 ? `$${totalSavings.toLocaleString()}` : '—', icon: '🏷️', highlight: totalSavings > 0 },
                        ].map(({ label, value, icon, highlight }) => (
                            <div key={label}
                                className={`bg-white rounded-2xl border px-5 sm:px-6 py-4 shadow-sm flex items-center gap-4
                                    ${highlight ? 'border-emerald-200' : 'border-gray-100'}`}>
                                <span className="text-2xl">{icon}</span>
                                <div>
                                    <p className={`text-xl font-bold ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
                                    <p className="text-xs text-gray-400">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
 
                {/* ── LOADING SKELETON — 2-col mobile → 4-col lg ── */}
                {loading && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 sm:h-72 animate-pulse"
                                style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="bg-gray-100 h-40 sm:h-44 rounded-t-2xl" />
                                <div className="p-3 sm:p-4 space-y-2">
                                    <div className="bg-gray-100 h-3 rounded w-1/3" />
                                    <div className="bg-gray-100 h-4 rounded w-3/4" />
                                    <div className="bg-gray-100 h-3 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
 
                {/* ── DEVICE GRID — 2-col mobile → 4-col lg ── */}
                {!loading && sorted.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {sorted.map((entry, i) => (
                            <WatchlistCard
                                key={entry.id}
                                entry={entry}
                                onRemove={handleRemove}
                                style={{ animationDelay: `${i * 45}ms` }}
                            />
                        ))}
                    </div>
                )}
 
                {/* ── EMPTY STATE ── */}
                {!loading && entries.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center">
                        <div className="relative w-20 sm:w-24 h-20 sm:h-24 mb-6">
                            <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-30" />
                            <div className="relative w-full h-full rounded-full bg-red-50 flex items-center justify-center">
                                <HeartIcon className="w-10 sm:w-12 h-10 sm:h-12 text-red-300" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Your watchlist is empty</h2>
                        <p className="text-sm text-gray-400 mb-8 max-w-xs leading-relaxed">
                            Tap the ♡ on any device to save it here. We&apos;ll keep track of prices for you.
                        </p>
                        <Link href="/devices"
                            className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-700 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                            Browse Devices
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </Link>
                        <div className="flex flex-wrap gap-2 justify-center mt-6">
                            {['iPhones', 'MacBooks', 'Samsung', 'iPads'].map(tag => (
                                <Link key={tag} href={`/devices?q=${tag}`}
                                    className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:border-teal-400 hover:text-teal-700 transition-colors">
                                    {tag}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
 
            <Footer />
 
            {/* ── TOAST ── */}
            {toast && (
                <div className={`fixed bottom-4 sm:bottom-7 right-4 sm:right-7 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-[fadeUp_.3s_ease_both]
                    ${toast.type === 'err' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                    {toast.msg}
                </div>
            )}
        </div>
    );
}