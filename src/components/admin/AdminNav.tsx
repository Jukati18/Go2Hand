'use client'

// src/components/admin/AdminNav.tsx
// ─────────────────────────────────────────────────────────────────
// Admin sidebar navigation.
// Highlights the active route, collapses on mobile.
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    HomeIcon,
    UsersIcon,
    DevicePhoneMobileIcon,
    ShoppingBagIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    ArrowLeftOnRectangleIcon,
    FlagIcon,
} from '@heroicons/react/24/outline'

const NAV_ITEMS = [
    { label: 'Overview',  href: '/admin',          icon: HomeIcon               },
    { label: 'Users',     href: '/admin/users',     icon: UsersIcon              },
    { label: 'Listings',  href: '/admin/listings',  icon: DevicePhoneMobileIcon  },
    { label: 'Orders',    href: '/admin/orders',    icon: ShoppingBagIcon        },
    { label: 'Reviews',   href: '/admin/reviews',   icon: FlagIcon               },
    { label: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon           },
]

export default function AdminNav() {
    const pathname = usePathname()

    return (
        <aside className="w-full lg:w-[220px] shrink-0">
            {/* Brand header */}
            <div className="flex items-center gap-2.5 px-4 py-4 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheckIcon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Admin Panel</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Go2Hand</p>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 px-2 lg:px-0">
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                    // Exact match for overview, prefix match for sub-pages
                    const isActive = href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(href)

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm
                                font-semibold whitespace-nowrap transition-all duration-150 shrink-0
                                ${isActive
                                    ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-transparent'
                                }`}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {/* Back to site */}
            <div className="mt-4 px-2 lg:px-0 hidden lg:block">
                <Link
                    href="/"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm
                        font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50
                        border border-transparent transition-all"
                >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4 shrink-0" />
                    Back to Site
                </Link>
            </div>
        </aside>
    )
}