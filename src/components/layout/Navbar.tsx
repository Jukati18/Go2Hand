"use client";

// ============================================
// NAVBAR — Shared across all pages
// ============================================

import Link from "next/link";
import { useState } from "react";
import {
    MagnifyingGlassIcon,
    HeartIcon,
    ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

interface NavbarProps {
    /** Prefill the search input (e.g. on detail page) */
    defaultSearch?: string;
}

export default function Navbar({ defaultSearch = "" }: NavbarProps) {
    const [search, setSearch] = useState(defaultSearch);

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-[1160px] mx-auto px-6 h-[62px] flex items-center justify-between gap-6">
                {/* ── Logo ── */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center">
                        {/* Cube/package icon */}
                        <svg
                            className="w-5 h-5 text-white"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L18.18 8 12 11.82 5.82 8 12 4.18zM5 9.5l6 3.32V19.5L5 16.18V9.5zm8 9.98v-7.16l6-3.32v6.68L13 19.48z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-teal-800">
                        Go2 <span className="text-amber-500">Hand</span>
                    </span>
                </Link>

                {/* ── Search ── */}
                <div className="flex-1 max-w-[420px]">
                    <div
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 
                          focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all"
                    >
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search devices, models, brands…"
                            className="w-full text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* ── Right actions ── */}
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/devices"
                        className="text-sm font-medium text-gray-600 hover:text-teal-700 px-3 py-2 rounded-lg 
                       hover:bg-gray-50 transition-colors"
                    >
                        Browse
                    </Link>

                    <Link
                        href="/sell"
                        className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white 
                       text-sm font-semibold px-4 py-2 rounded-full transition-all 
                       hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <span>+</span> Sell Device
                    </Link>

                    {/* Watchlist icon */}
                    <button
                        className="relative w-9 h-9 flex items-center justify-center rounded-full 
                       border border-gray-200 hover:border-teal-400 transition-colors"
                        aria-label="Watchlist"
                    >
                        <HeartIcon className="w-[18px] h-[18px] text-gray-500" />
                        {/* Badge */}
                        <span
                            className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white 
                             text-[9px] font-bold rounded-full flex items-center justify-center 
                             border-2 border-white"
                        >
                            3
                        </span>
                    </button>

                    {/* Avatar */}
                    <div
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-emerald-500 
                          flex items-center justify-center text-white text-xs font-bold cursor-pointer
                          hover:opacity-90 transition-opacity"
                    >
                        AJ
                    </div>
                </div>
            </div>
        </nav>
    );
}
