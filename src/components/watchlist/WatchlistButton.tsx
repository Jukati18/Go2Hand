'use client';

// ============================================
// WATCHLIST BUTTON — Heart toggle for any device
//
// Variants:
//   'icon'  → round icon button (DeviceCard hover overlay)
//   'pill'  → labeled button (DeviceDetailClient sidebar)
//
// Features:
//  • Optimistic UI update (instant visual feedback)
//  • Reverts on server error
//  • Handles unauthenticated state gracefully
//  • Pulse animation on save
// ============================================

import { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { actionToggleWatchlist } from '@/actions/watchlist';

interface WatchlistButtonProps {
    deviceId: string;
    initialSaved?: boolean;
    /** 'icon' = compact circle button, 'pill' = labeled button */
    variant?: 'icon' | 'pill';
    size?: 'sm' | 'md';
    className?: string;
    /** Optional callback so parent can react to state changes */
    onToggle?: (isSaved: boolean) => void;
    /** Parent-provided toast handler so we don't double-render toast layers */
    showToast?: (msg: string) => void;
}

export default function WatchlistButton({
    deviceId,
    initialSaved = false,
    variant = 'icon',
    size = 'md',
    className = '',
    onToggle,
    showToast,
}: WatchlistButtonProps) {
    const [isSaved, setIsSaved] = useState(initialSaved);
    const [loading, setLoading] = useState(false);
    // Trigger the pop animation once on save
    const [popped, setPopped] = useState(false);

    async function handleToggle(e: React.MouseEvent) {
        e.preventDefault();  // Don't navigate if inside a <Link>
        e.stopPropagation();
        if (loading) return;

        // ── Optimistic update ──────────────────────────────────
        const next = !isSaved;
        setIsSaved(next);
        if (next) {
            setPopped(true);
            setTimeout(() => setPopped(false), 400);
        }
        setLoading(true);

        const result = await actionToggleWatchlist(deviceId);

        if (!result.success) {
            // Revert on error (e.g. not logged in)
            setIsSaved(!next);
            showToast?.(
                result.error === 'Login required'
                    ? 'Sign in to save devices to your watchlist'
                    : (result.error ?? 'Something went wrong')
            );
        } else {
            showToast?.(next ? '❤️ Added to watchlist!' : 'Removed from watchlist');
            onToggle?.(next);
        }

        setLoading(false);
    }

    // ── Pill variant (used in DeviceDetailClient sidebar) ──────
    if (variant === 'pill') {
        return (
            <button
                onClick={handleToggle}
                disabled={loading}
                aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
                className={cn(
                    `h-10 flex items-center justify-center gap-1.5 rounded-lg border-2
                    text-xs font-semibold transition-all duration-200 active:scale-95`,
                    isSaved
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50',
                    loading && 'opacity-50 cursor-wait',
                    className
                )}
            >
                {isSaved
                    ? <HeartSolid className="w-3.5 h-3.5 text-red-500" />
                    : <HeartIcon className="w-3.5 h-3.5" />
                }
                {isSaved ? 'Saved' : 'Watchlist'}
            </button>
        );
    }

    // ── Icon variant (used on DeviceCard hover + standalone) ──
    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
            className={cn(
                `flex items-center justify-center rounded-full
                border border-white/80 backdrop-blur-sm
                transition-all duration-200 active:scale-90
                shadow-sm`,
                size === 'sm' ? 'w-7 h-7' : 'w-9 h-9',
                isSaved
                    ? 'bg-red-500 border-red-400 text-white'
                    : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200',
                loading && 'opacity-50 cursor-wait',
                popped && 'scale-125',
                className
            )}
        >
            {isSaved
                ? (
                    <HeartSolid
                        className={cn(
                            'text-white transition-transform duration-200',
                            size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5',
                            popped && 'scale-125'
                        )}
                        style={{ width: size === 'sm' ? 14 : 18, height: size === 'sm' ? 14 : 18 }}
                    />
                ) : (
                    <HeartIcon
                        style={{ width: size === 'sm' ? 14 : 18, height: size === 'sm' ? 14 : 18 }}
                    />
                )
            }
        </button>
    );
}