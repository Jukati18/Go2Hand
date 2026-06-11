'use client';

// src/components/cart/CartItemCard.tsx
// ─────────────────────────────────────────────────────────────────
// Rich device preview card for a single cart item.
// Shows image, title, price, escrow badge, and three action buttons:
//   • Buy Now  → routes to /checkout/[deviceId]
//   • Watchlist → saves to watchlist (requires auth)
//   • Remove   → optimistic remove with undo via parent toast
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    TrashIcon,
    HeartIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import type { CartItem } from '@/context/CartContext';
 
function fmt(n: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0,
    }).format(n);
}
 
interface CartItemCardProps {
    item: CartItem;
    index: number;
    isAuthenticated: boolean;
    isSavedToWatchlist: boolean;
    isWatchlistLoading: boolean;
    onRemove: (item: CartItem) => void;
    onMoveToWatchlist: (item: CartItem) => void;
    onCheckout: (deviceId: string) => void;
}
 
export default function CartItemCard({
    item,
    index,
    isAuthenticated,
    isSavedToWatchlist,
    isWatchlistLoading,
    onRemove,
    onMoveToWatchlist,
    onCheckout,
}: CartItemCardProps) {
    // Local removing state drives the exit animation
    const [removing, setRemoving] = useState(false);
 
    function handleRemoveClick() {
        setRemoving(true);
        // Short delay so CSS transition plays before item is unmounted
        setTimeout(() => onRemove(item), 200);
    }
 
    return (
        <div
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                transition-all duration-300 animate-[fadeUp_.35s_ease_both]
                hover:shadow-md hover:border-teal-100
                ${removing ? 'opacity-0 scale-95 -translate-x-4' : 'opacity-100'}`}
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Teal accent stripe */}
            <div className="h-0.5 bg-gradient-to-r from-teal-500 to-emerald-400" />
 
            <div className="p-4 sm:p-5 flex gap-4">
 
                {/* Device image — links to detail page */}
                <Link
                    href={`/devices/${item.deviceId}`}
                    className="shrink-0 w-[90px] sm:w-[110px] h-[90px] sm:h-[110px]
                        bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden
                        flex items-center justify-center
                        hover:border-teal-300 transition-colors group"
                >
                    {item.imageUrl ? (
                        <Image
                            src={item.imageUrl}
                            alt={item.title}
                            width={110}
                            height={110}
                            className="w-[75%] h-[75%] object-contain
                                group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                        />
                    ) : (
                        <span className="text-4xl select-none">📱</span>
                    )}
                </Link>
 
                {/* Device info */}
                <div className="flex-1 min-w-0">
 
                    {/* Title */}
                    <Link
                        href={`/devices/${item.deviceId}`}
                        className="block text-sm sm:text-base font-semibold text-gray-900
                            leading-snug line-clamp-2 hover:text-teal-800 transition-colors mb-2"
                    >
                        {item.title}
                    </Link>
 
                    {/* Added date */}
                    <p className="text-[11px] text-gray-400 mb-3">
                        Added {new Date(item.addedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                        })}
                    </p>
 
                    {/* Price + free shipping */}
                    <div className="flex items-baseline gap-2 mb-3 flex-wrap">
                        <span className="text-xl sm:text-2xl font-bold text-gray-900">
                            {fmt(item.price)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50
                            px-2 py-0.5 rounded-full">
                            FREE SHIPPING
                        </span>
                    </div>
 
                    {/* Escrow mini-badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-teal-700
                        bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1.5 w-fit mb-3">
                        <ShieldCheckIcon className="w-3.5 h-3.5 shrink-0" />
                        Escrow protected — pay only after you approve
                    </div>
 
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
 
                        {/* Checkout — primary CTA */}
                        <button
                            onClick={() => onCheckout(item.deviceId)}
                            className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700
                                text-white font-bold text-xs px-4 py-2.5 rounded-xl
                                transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                        >
                            {isAuthenticated ? `Checkout — ${fmt(item.price)}` : 'Sign in to Checkout'}
                        </button>
 
                        {/* Save to Watchlist */}
                        <button
                            onClick={() => onMoveToWatchlist(item)}
                            disabled={isWatchlistLoading || isSavedToWatchlist}
                            className={`flex items-center gap-1.5 text-xs font-semibold
                                px-3 py-2.5 rounded-xl border-2 transition-all disabled:cursor-default
                                ${isSavedToWatchlist
                                    ? 'border-red-200 bg-red-50 text-red-600'
                                    : 'border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
                                }`}
                        >
                            {isWatchlistLoading ? (
                                /* Spinner */
                                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".3"/>
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                            ) : isSavedToWatchlist ? (
                                <HeartSolid className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                                <HeartIcon className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">
                                {isSavedToWatchlist ? 'Saved' : 'Watchlist'}
                            </span>
                        </button>
 
                        {/* Remove */}
                        <button
                            onClick={handleRemoveClick}
                            className="flex items-center gap-1.5 text-xs font-semibold
                                px-3 py-2.5 rounded-xl border-2 border-gray-100 text-gray-400
                                hover:border-red-200 hover:text-red-500 hover:bg-red-50
                                transition-all"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}