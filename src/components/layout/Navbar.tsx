"use client";

// src/components/layout/Navbar.tsx

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    HeartIcon, BellIcon, ChevronDownIcon, UserCircleIcon,
    ClipboardDocumentListIcon, ShoppingBagIcon, Cog6ToothIcon,
    ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon,
    ShoppingCartIcon, ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import SearchBar from "@/components/layout/SearchBar";
import { useCart } from "@/context/CartContext";
import { actionSignOut } from "@/actions/auth";

const CATEGORIES = [
    { icon: '📱', label: 'Smartphones', href: '/categories/smartphones', desc: '1,200+ listings' },
    { icon: '💻', label: 'Laptops',     href: '/categories/laptops',     desc: '340+ listings'  },
    { icon: '⬛', label: 'Tablets',     href: '/categories/tablets',     desc: '180+ listings'  },
    { icon: '⌚', label: 'Smartwatches',href: '/categories/watches',     desc: '95+ listings'   },
    { icon: '🎧', label: 'Audio',       href: '/categories/audio',       desc: '210+ listings'  },
    { icon: '🖥️', label: 'Desktops',   href: '/categories/desktops',    desc: '60+ listings'   },
];

// ── Dropdown menu — split into Buyer and Seller sections ──────────
const BUYER_MENU = [
    { icon: UserCircleIcon,            label: 'My Profile',      href: '/profile'           },
    { icon: ShoppingBagIcon,           label: 'My Purchases',    href: '/dashboard/buyer'   },
    { icon: HeartIcon,                 label: 'Watchlist',       href: '/watchlist'         },
    { icon: ChatBubbleLeftEllipsisIcon,label: 'Messages',        href: '/dashboard/messages'},
];

const SELLER_MENU = [
    { icon: ClipboardDocumentListIcon, label: 'My Listings',     href: '/dashboard/listings'},
    { icon: ShoppingBagIcon,           label: 'Seller Dashboard',href: '/dashboard'         },
    { icon: Cog6ToothIcon,             label: 'Settings',        href: '/settings'          },
];

export default function Navbar() {
    const router = useRouter();
    const [userMenuOpen,     setUserMenuOpen]     = useState(false);
    const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [signingOut,       setSigningOut]        = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const { count: cartCount } = useCart();

    // ── Close user dropdown on outside click ──────────────────────
    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);

    // ── Lock body scroll while mobile menu is open ────────────────
    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    function closeMobileMenu() { setMobileMenuOpen(false); }

    // ── Sign out handler ──────────────────────────────────────────
    const handleSignOut = useCallback(async () => {
        setSigningOut(true);
        setUserMenuOpen(false);
        closeMobileMenu();

        const result = await actionSignOut();

        if (result.success) {
            router.push('/');
            router.refresh();
        } else {
            console.error('Sign out failed:', result.error);
        }
        setSigningOut(false);
    }, [router]);

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-[62px] flex items-center justify-between gap-3 sm:gap-5">

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

                    {/* ── Search bar — desktop ── */}
                    <div className="hidden md:flex flex-1 max-w-[460px]">
                        <SearchBar />
                    </div>

                    {/* ── Desktop right actions ── */}
                    <div className="hidden md:flex items-center gap-1 shrink-0">

                        {/* Browse megamenu */}
                        <div className="relative group">
                            <button className="flex items-center gap-1 text-sm font-medium text-gray-600
                                hover:text-teal-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                Browse
                                <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 transition-transform
                                    duration-200 group-hover:rotate-180" />
                            </button>
                            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2
                                w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50
                                opacity-0 invisible translate-y-2 pointer-events-none
                                group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                                group-hover:pointer-events-auto transition-all duration-200 ease-out">
                                <div className="absolute -top-[7px] left-1/2 -translate-x-1/2
                                    w-3.5 h-3.5 bg-white border-l border-t border-gray-100 rotate-45" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase
                                    tracking-widest mb-3 px-1">Browse by Category</p>
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

                        {/* Sell CTA */}
                        <Link href="/sell"
                            className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white
                                text-sm font-semibold px-4 py-2 rounded-full transition-all ml-1
                                hover:-translate-y-0.5 hover:shadow-md">
                            <span className="text-base leading-none">+</span>
                            Sell Device
                        </Link>

                        {/* Notification bell */}
                        <button className="relative w-9 h-9 flex items-center justify-center rounded-full
                            border border-gray-200 hover:border-teal-400 hover:bg-teal-50
                            transition-colors ml-1" aria-label="Notifications">
                            <BellIcon className="w-[18px] h-[18px] text-gray-500" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500
                                rounded-full border-2 border-white" />
                        </button>

                        {/* Messages icon — quick link */}
                        <Link href="/dashboard/messages"
                            aria-label="Messages"
                            className="relative w-9 h-9 flex items-center justify-center rounded-full
                                border border-gray-200 hover:border-teal-400 hover:bg-teal-50
                                transition-all duration-150 group">
                            <ChatBubbleLeftEllipsisIcon className="w-[18px] h-[18px] text-gray-500
                                group-hover:text-teal-600 transition-colors" />
                        </Link>

                        {/* Cart icon */}
                        <Link href="/cart"
                            aria-label={`Cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
                            className="relative w-9 h-9 flex items-center justify-center rounded-full
                                border border-gray-200 hover:border-teal-400 hover:bg-teal-50
                                transition-all duration-150 group">
                            <ShoppingCartIcon className="w-[18px] h-[18px] text-gray-500
                                group-hover:text-teal-600 transition-colors" />
                            <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1
                                bg-teal-700 text-white text-[9px] font-bold rounded-full
                                flex items-center justify-center border-2 border-white
                                transition-all duration-200 ease-out
                                ${cartCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
                                aria-hidden="true">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        </Link>

                        {/* Watchlist heart */}
                        <Link href="/watchlist"
                            className="relative w-9 h-9 flex items-center justify-center rounded-full
                                border border-gray-200 hover:border-teal-400 hover:bg-teal-50
                                transition-colors" aria-label="Watchlist">
                            <HeartIcon className="w-[18px] h-[18px] text-gray-500" />
                        </Link>

                        {/* Avatar + user dropdown */}
                        <div ref={userMenuRef} className="relative ml-1">
                            <button
                                onClick={() => setUserMenuOpen(o => !o)}
                                aria-expanded={userMenuOpen}
                                aria-label="User menu"
                                className={`flex items-center gap-1.5 rounded-full pl-0.5 pr-2.5 py-0.5
                                    border transition-all duration-150
                                    ${userMenuOpen
                                        ? 'border-teal-400 bg-teal-50'
                                        : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br
                                    from-teal-600 to-emerald-500 flex items-center justify-center
                                    text-white text-xs font-bold">AJ</div>
                                <ChevronDownIcon className={`w-3 h-3 text-gray-400 transition-transform
                                    duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 w-56
                                    bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50
                                    animate-[fadeDown_.15s_ease_both]">

                                    {/* User info */}
                                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br
                                            from-teal-600 to-emerald-500 flex items-center justify-center
                                            text-white text-sm font-bold shrink-0">AJ</div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">Alex Johnson</p>
                                            <p className="text-xs text-gray-400 truncate">alex@email.com</p>
                                        </div>
                                    </div>

                                    {/* Buyer section */}
                                    <div className="pt-1.5 pb-1">
                                        <p className="text-[9px] font-bold text-gray-300 uppercase
                                            tracking-widest px-4 py-1.5">Buying</p>
                                        {BUYER_MENU.map(({ icon: Icon, label, href }) => (
                                            <Link key={label} href={href}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm
                                                    text-gray-600 hover:text-teal-700 hover:bg-teal-50
                                                    transition-colors">
                                                <Icon className="w-4 h-4 shrink-0" />{label}
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Seller section */}
                                    <div className="border-t border-gray-100 pt-1.5 pb-1">
                                        <p className="text-[9px] font-bold text-gray-300 uppercase
                                            tracking-widest px-4 py-1.5">Selling</p>
                                        {SELLER_MENU.map(({ icon: Icon, label, href }) => (
                                            <Link key={label} href={href}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm
                                                    text-gray-600 hover:text-teal-700 hover:bg-teal-50
                                                    transition-colors">
                                                <Icon className="w-4 h-4 shrink-0" />{label}
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Sign out */}
                                    <div className="border-t border-gray-100 pt-1.5 pb-1">
                                        <button
                                            onClick={handleSignOut}
                                            disabled={signingOut}
                                            className="flex items-center gap-3 w-full px-4 py-2.5
                                                text-sm text-red-500 hover:bg-red-50 transition-colors
                                                disabled:opacity-60 disabled:cursor-wait">
                                            {signingOut ? (
                                                <svg className="w-4 h-4 animate-spin shrink-0"
                                                    viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor"
                                                        strokeWidth="3" strokeOpacity=".3"/>
                                                    <path d="M12 2a10 10 0 0 1 10 10"
                                                        stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                                </svg>
                                            ) : (
                                                <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" />
                                            )}
                                            {signingOut ? 'Signing out…' : 'Sign Out'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Mobile right actions ── */}
                    <div className="flex md:hidden items-center gap-1 shrink-0">
                        <button
                            onClick={() => setMobileSearchOpen(o => !o)}
                            className="w-9 h-9 flex items-center justify-center rounded-full
                                border border-gray-200 hover:border-teal-400 transition-colors"
                            aria-label="Search">
                            <MagnifyingGlassIcon className="w-[18px] h-[18px] text-gray-500" />
                        </button>

                        <Link href="/cart"
                            aria-label={`Cart — ${cartCount} items`}
                            className="relative w-9 h-9 flex items-center justify-center rounded-full
                                border border-gray-200 hover:border-teal-400 transition-colors">
                            <ShoppingCartIcon className="w-[18px] h-[18px] text-gray-500" />
                            <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1
                                bg-teal-700 text-white text-[9px] font-bold rounded-full
                                flex items-center justify-center border-2 border-white
                                transition-all duration-200 ease-out
                                ${cartCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
                                aria-hidden="true">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        </Link>

                        <Link href="/watchlist"
                            className="relative w-9 h-9 flex items-center justify-center rounded-full
                                border border-gray-200 hover:border-teal-400 transition-colors"
                            aria-label="Watchlist">
                            <HeartIcon className="w-[18px] h-[18px] text-gray-500" />
                        </Link>

                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-full
                                border border-gray-200 hover:border-teal-400 transition-colors"
                            aria-label="Open menu">
                            <Bars3Icon className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* ── Mobile search expander ── */}
                {mobileSearchOpen && (
                    <div className="md:hidden px-4 pb-3 pt-1 border-t border-gray-100 bg-white">
                        <SearchBar />
                    </div>
                )}
            </nav>

            {/* ── Mobile backdrop ── */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 md:hidden"
                    onClick={closeMobileMenu} aria-hidden="true" />
            )}

            {/* ── Mobile drawer ── */}
            <div className={`fixed top-0 right-0 bottom-0 z-50 w-[300px] bg-white shadow-2xl
                overflow-y-auto flex flex-col md:hidden
                transition-transform duration-300 ease-out
                ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <span className="font-bold text-gray-900">Menu</span>
                    <button onClick={closeMobileMenu}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Close menu">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* User info */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-emerald-500
                        flex items-center justify-center text-white text-sm font-bold shrink-0">AJ</div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">Alex Johnson</p>
                        <p className="text-xs text-gray-400 truncate">alex@email.com</p>
                    </div>
                </div>

                {/* Sell CTA */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <Link href="/sell" onClick={closeMobileMenu}
                        className="flex items-center justify-center gap-2 bg-teal-800 text-white
                            font-semibold px-4 py-3 rounded-xl text-sm w-full hover:bg-teal-700 transition-colors">
                        <span className="text-base leading-none">+</span>
                        Sell a Device
                    </Link>
                </div>

                {/* Browse categories */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Browse</p>
                    <div className="flex flex-col gap-0.5">
                        {CATEGORIES.map(({ icon, label, href }) => (
                            <Link key={label} href={href} onClick={closeMobileMenu}
                                className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm
                                    text-gray-700 hover:bg-teal-50 hover:text-teal-800 transition-colors">
                                <span className="text-xl leading-none w-7 text-center">{icon}</span>
                                {label}
                            </Link>
                        ))}
                        <Link href="/devices" onClick={closeMobileMenu}
                            className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm
                                text-teal-700 font-semibold hover:bg-teal-50 transition-colors">
                            <span className="w-7 text-center text-base">→</span>
                            All Devices
                        </Link>
                    </div>
                </div>

                {/* Buying section */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Buying
                    </p>
                    <div className="flex flex-col gap-0.5">
                        {BUYER_MENU.map(({ icon: Icon, label, href }) => (
                            <Link key={label} href={href} onClick={closeMobileMenu}
                                className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm
                                    text-gray-700 hover:bg-teal-50 hover:text-teal-800 transition-colors">
                                <Icon className="w-4 h-4 shrink-0 text-gray-400" />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Selling section */}
                <div className="px-5 py-4 flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Selling
                    </p>
                    <div className="flex flex-col gap-0.5">
                        {SELLER_MENU.map(({ icon: Icon, label, href }) => (
                            <Link key={label} href={href} onClick={closeMobileMenu}
                                className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm
                                    text-gray-700 hover:bg-teal-50 hover:text-teal-800 transition-colors">
                                <Icon className="w-4 h-4 shrink-0 text-gray-400" />
                                {label}
                            </Link>
                        ))}

                        {/* Sign out */}
                        <button
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="flex items-center gap-3 w-full px-2 py-2.5 rounded-xl text-sm
                                text-red-500 hover:bg-red-50 transition-colors mt-2
                                disabled:opacity-60 disabled:cursor-wait">
                            {signingOut ? (
                                <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor"
                                        strokeWidth="3" strokeOpacity=".3"/>
                                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"
                                        strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                            ) : (
                                <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" />
                            )}
                            {signingOut ? 'Signing out…' : 'Sign Out'}
                        </button>
                    </div>
                </div>

                {/* Notifications footer */}
                <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                    <Link href="/notifications" onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm
                            text-gray-700 hover:bg-gray-50 transition-colors">
                        <div className="relative">
                            <BellIcon className="w-4 h-4 text-gray-400" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                        Notifications
                    </Link>
                </div>
            </div>
        </>
    );
}