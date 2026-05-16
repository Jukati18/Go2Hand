'use client';

// ============================================
// WATCHLIST CARD — Card displayed on /watchlist
//
// Shows:
//  • Device image + verified badge
//  • Brand / model / storage · color
//  • Price + original price + discount %
//  • Condition badge
//  • "Saved X days ago" timestamp
//  • Hover → red remove button (top-right)
//  • Entrance animation with stagger via style prop
// ============================================

import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';

// ── Mirrored from getWatchlist() return shape ─────────────────────
// We keep it loose (any) because Supabase JSONB nesting can vary
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WatchlistProduct = Record<string, any>;

export interface WatchlistEntry {
    id: string;
    created_at: string;
    product: WatchlistProduct | null;
}

interface WatchlistCardProps {
    entry: WatchlistEntry;
    onRemove: (productId: string) => void;
    style?: React.CSSProperties;
}

// ── Helpers ────────────────────────────────────────────────────────
const CONDITION_STYLE: Record<string, string> = {
    like_new:  'bg-emerald-50 text-emerald-700',
    excellent: 'bg-emerald-50 text-emerald-700',
    good:      'bg-cyan-50 text-cyan-800',
    fair:      'bg-amber-50 text-amber-700',
};
const CONDITION_LABEL: Record<string, string> = {
    like_new:  'Like New',
    excellent: 'Excellent',
    good:      'Good',
    fair:      'Fair',
};

function daysSince(iso: string): string {
    const diff = Math.floor(
        (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return 'today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
}

// ─────────────────────────────────────────────────────────────────
export default function WatchlistCard({ entry, onRemove, style }: WatchlistCardProps) {
    const p = entry.product;
    if (!p) return null;

    const discount = p.original_price && p.original_price > p.price
        ? Math.round((1 - p.price / p.original_price) * 100)
        : 0;

    const brandName = (p.brand as { name?: string } | null)?.name ?? 'Unknown';
    const condStyle = CONDITION_STYLE[p.condition] ?? 'bg-gray-100 text-gray-600';
    const condLabel = CONDITION_LABEL[p.condition] ?? p.condition ?? '—';

    return (
        <div
            className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden
                shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                animate-[fadeUp_.35s_ease_both]"
            style={style}
        >
            {/* ── Remove button (top-right, visible on hover) ── */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(p.id);
                }}
                title="Remove from watchlist"
                className="absolute top-3 right-3 z-20 w-8 h-8
                    bg-white/90 backdrop-blur-sm rounded-full border border-gray-200
                    flex items-center justify-center shadow-sm
                    opacity-0 group-hover:opacity-100
                    hover:bg-red-50 hover:border-red-200
                    transition-all duration-200 hover:scale-110 active:scale-95"
            >
                <HeartIcon className="w-4 h-4 text-red-500" />
            </button>

            {/* ── Discount ribbon ── */}
            {discount > 0 && (
                <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white
                    text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    -{discount}%
                </div>
            )}

            {/* ── Everything inside is a link ── */}
            <Link href={`/devices/${p.id}`} className="block">

                {/* Image area */}
                <div className="relative bg-gray-50 h-44 flex items-center justify-center overflow-hidden">
                    {p.images?.[0] ? (
                        <Image
                            src={p.images[0]}
                            alt={p.title ?? 'Device'}
                            width={200}
                            height={200}
                            className="w-[65%] h-[65%] object-contain
                                group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                        />
                    ) : (
                        <span className="text-5xl select-none">📱</span>
                    )}

                    {/* Verified badge */}
                    {p.is_verified && (
                        <span className="absolute bottom-3 left-3 bg-emerald-500 text-white
                            text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ✓ Verified
                        </span>
                    )}
                </div>

                {/* Card body */}
                <div className="p-4">
                    {/* Brand */}
                    <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mb-1">
                        {brandName}
                    </p>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2">
                        {p.title ?? '—'}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-[12px] text-gray-400 mb-3">
                        {[p.storage_capacity, p.color].filter(Boolean).join(' · ') || '—'}
                    </p>

                    {/* Price row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[17px] font-bold text-gray-900">
                                ${p.price}
                            </span>
                            {discount > 0 && (
                                <span className="text-xs text-gray-400 line-through">
                                    ${p.original_price}
                                </span>
                            )}
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${condStyle}`}>
                            {condLabel}
                        </span>
                    </div>

                    {/* Saved timestamp */}
                    <div className="flex items-center gap-1 mt-2.5 pt-2.5 border-t border-gray-50">
                        <ClockIcon className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="text-[11px] text-gray-400">
                            Saved {daysSince(entry.created_at)}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
}