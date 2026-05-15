"use client";

// ============================================
// NAVBAR — Shared across all pages
//
// Week 4 upgrade:
//  • SearchBar with autocomplete extracted into
//    its own component (SearchBar.tsx)
//  • "Browse" → category megamenu on hover
//  • Avatar → user dropdown on click
//  • Notification bell with unread dot
// ============================================

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
    HeartIcon,
    BellIcon,
    ChevronDownIcon,
    UserCircleIcon,
    ClipboardDocumentListIcon,
    ShoppingBagIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import SearchBar from "@/components/layout/SearchBar";

// ── Category megamenu data ────────────────────────────────────────
const CATEGORIES = [
    { icon: '📱', label: 'Smartphones', href: '/devices?category=smartphones', desc: '1,200+ listings' },
    { icon: '💻', label: 'Laptops',     href: '/devices?category=laptops',     desc: '340+ listings' },
    { icon: '⬛', label: 'Tablets',     href: '/devices?category=tablets',     desc: '180+ listings' },
    { icon: '⌚', label: 'Smartwatches',href: '/devices?category=watches',     desc: '95+ listings'  },
    { icon: '🎧', label: 'Audio',       href: '/devices?category=audio',       desc: '210+ listings' },
    { icon: '🖥️', label: 'Desktops',   href: '/devices?category=desktops',    desc: '60+ listings'  },
]

// ── User menu items ───────────────────────────────────────────────
const USER_MENU = [
    { icon: UserCircleIcon,            label: 'My Profile',  href: '/profile'             },
    { icon: ClipboardDocumentListIcon, label: 'My Listings', href: '/dashboard/listings'  },
    { icon: ShoppingBagIcon,           label: 'My Orders',   href: '/dashboard/orders'    },
    { icon: HeartIcon,                 label: 'Watchlist',   href: '/watchlist'           },
    { icon: Cog6ToothIcon,             label: 'Settings',    href: '/settings'            },
]

export default function Navbar() {
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

    // Close user dropdown on outside click
    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', onMouseDown)
        return () => document.removeEventListener('mousedown', onMouseDown)
    }, [])

    return (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-[1160px] mx-auto px-6 h-[62px] flex items-center justify-between gap-5">

                {/* ── Logo ── */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L18.18 8 12 11.82 5.82 8 12 4.18zM5 9.5l6 3.32V19.5L5 16.18V9.5zm8 9.98v-7.16l6-3.32v6.68L13 19.48z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-teal-800">
                        Go2 <span className="text-amber-500">Hand</span>
                    </span>
                </Link>

                {/* ── Autocomplete Search Bar ── */}
                <SearchBar />

                {/* ── Right-side actions ── */}
                <div className="flex items-center gap-1 shrink-0">

                    {/* Browse → category megamenu on hover */}
                    <div className="relative group">
                        <button className="flex items-center gap-1 text-sm font-medium text-gray-600
                            hover:text-teal-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            Browse
                            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 transition-transform
                                duration-200 group-hover:rotate-180" />
                        </button>

                        {/* Megamenu panel — CSS hover, no JS needed */}
                        <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2
                            w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50
                            opacity-0 invisible translate-y-2 pointer-events-none
                            group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                            group-hover:pointer-events-auto
                            transition-all duration-200 ease-out">

                            {/* Caret arrow */}
                            <div className="absolute -top-[7px] left-1/2 -translate-x-1/2
                                w-3.5 h-3.5 bg-white border-l border-t border-gray-100 rotate-45" />

                            <p className="text-[10px] font-bold text-gray-400 uppercase
                                tracking-widest mb-3 px-1">
                                Browse by Category
                            </p>

                            <div className="grid grid-cols-2 gap-1.5">
                                {CATEGORIES.map(({ icon, label, href, desc }) => (
                                    <Link key={label} href={href}
                                        className="flex items-center gap-3 p-3 rounded-xl
                                            hover:bg-teal-50 transition-colors group/item">
                                        <span className="text-xl leading-none">{icon}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800
                                                group-hover/item:text-teal-800 transition-colors leading-tight">
                                                {label}
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <Link href="/devices"
                                    className="flex items-center justify-center gap-1.5 text-sm
                                        font-semibold text-teal-700 hover:text-teal-900 transition-colors py-1">
                                    View all devices →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Sell Device CTA */}
                    <Link href="/sell"
                        className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white
                            text-sm font-semibold px-4 py-2 rounded-full transition-all ml-1
                            hover:-translate-y-0.5 hover:shadow-md">
                        <span className="text-base leading-none">+</span>
                        Sell Device
                    </Link>

                    {/* Notification bell */}
                    <button
                        className="relative w-9 h-9 flex items-center justify-center rounded-full
                            border border-gray-200 hover:border-teal-400 hover:bg-teal-50
                            transition-colors ml-1"
                        aria-label="Notifications">
                        <BellIcon className="w-[18px] h-[18px] text-gray-500" />
                        {/* Unread dot */}
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500
                            rounded-full border-2 border-white" />
                    </button>

                    {/* Watchlist heart */}
                    <Link href="/watchlist"
                        className="relative w-9 h-9 flex items-center justify-center rounded-full
                            border border-gray-200 hover:border-teal-400 hover:bg-teal-50
                            transition-colors"
                        aria-label="Watchlist">
                        <HeartIcon className="w-[18px] h-[18px] text-gray-500" />
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1
                            bg-amber-500 text-white text-[9px] font-bold rounded-full
                            flex items-center justify-center border-2 border-white">
                            3
                        </span>
                    </Link>

                    {/* ── Avatar + user dropdown ── */}
                    <div ref={userMenuRef} className="relative ml-1">
                        <button
                            onClick={() => setUserMenuOpen((o) => !o)}
                            aria-expanded={userMenuOpen}
                            aria-label="User menu"
                            className={`flex items-center gap-1.5 rounded-full pl-0.5 pr-2.5 py-0.5
                                border transition-all duration-150
                                ${userMenuOpen
                                    ? 'border-teal-400 bg-teal-50'
                                    : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'}`}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br
                                from-teal-600 to-emerald-500 flex items-center justify-center
                                text-white text-xs font-bold">
                                AJ
                            </div>
                            <ChevronDownIcon className={`w-3 h-3 text-gray-400 transition-transform
                                duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* User dropdown panel */}
                        {userMenuOpen && (
                            <div className="absolute top-[calc(100%+8px)] right-0 w-52
                                bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50
                                animate-[fadeDown_.15s_ease_both]">

                                {/* User info */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br
                                        from-teal-600 to-emerald-500 flex items-center justify-center
                                        text-white text-sm font-bold shrink-0">
                                        AJ
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            Alex Johnson
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">alex@email.com</p>
                                    </div>
                                </div>

                                {/* Menu links */}
                                <div className="py-1.5">
                                    {USER_MENU.map(({ icon: Icon, label, href }) => (
                                        <Link key={label} href={href}
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm
                                                text-gray-600 hover:text-teal-700 hover:bg-teal-50
                                                transition-colors">
                                            <Icon className="w-4 h-4 shrink-0" />
                                            {label}
                                        </Link>
                                    ))}
                                </div>

                                {/* Sign out */}
                                <div className="border-t border-gray-100 pt-1.5 pb-1">
                                    <button
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-3 w-full px-4 py-2.5
                                            text-sm text-red-500 hover:bg-red-50 transition-colors">
                                        <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}