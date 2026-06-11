'use client';

// src/components/cart/EmptyCartState.tsx
// ─────────────────────────────────────────────────────────────────
// Shown when the cart has no items.
// Includes animated icon, CTA to browse, quick category links,
// and trust badges.
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
    ShoppingCartIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

const QUICK_LINKS = [
    { label: '📱 iPhones',  href: '/categories/smartphones/apple'   },
    { label: '💻 MacBooks', href: '/categories/laptops/apple'       },
    { label: '🤖 Samsung',  href: '/categories/smartphones/samsung' },
    { label: '⬛ iPads',    href: '/categories/tablets/apple'       },
];

const TRUST_BADGES = [
    { icon: ShieldCheckIcon, label: 'Escrow protected' },
    { icon: CheckCircleIcon, label: 'IMEI verified'    },
    { icon: ArrowPathIcon,   label: '30-day returns'   },
];

export default function EmptyCartState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center
            animate-[fadeUp_.4s_ease_both]">

            {/* Animated cart icon */}
            <div className="relative w-24 h-24 mb-7">
                <div className="absolute inset-0 rounded-2xl bg-teal-50 animate-pulse opacity-60" />
                <div className="relative w-24 h-24 rounded-2xl bg-teal-50
                    flex items-center justify-center border border-teal-100">
                    <ShoppingCartIcon className="w-12 h-12 text-teal-300" />
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-gray-200
                        rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-500">0</span>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-sm text-gray-400 mb-8 max-w-sm leading-relaxed">
                Browse our verified second-hand devices and add items here.
                Every purchase is escrow-protected — your money is safe until
                you approve the device.
            </p>

            {/* Primary CTA */}
            <Link
                href="/devices"
                className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-700
                    text-white font-semibold px-7 py-3.5 rounded-xl text-sm
                    transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
                <SparklesIcon className="w-4 h-4" />
                Browse Verified Devices
            </Link>

            {/* Quick category links */}
            <div className="flex flex-wrap gap-2 justify-center mt-6">
                {QUICK_LINKS.map(({ label, href }) => (
                    <Link
                        key={label}
                        href={href}
                        className="text-xs font-medium text-gray-600 bg-white border border-gray-200
                            px-3.5 py-2 rounded-full hover:border-teal-400 hover:text-teal-800
                            hover:bg-teal-50 transition-all duration-150"
                    >
                        {label}
                    </Link>
                ))}
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
                {TRUST_BADGES.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Icon className="w-3.5 h-3.5 text-teal-500" />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}