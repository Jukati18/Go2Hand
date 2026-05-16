// src/components/layout/Breadcrumb.tsx
// ============================================
// BREADCRUMB — Reusable, dynamic breadcrumb nav
//
// Usage (light background):
//   <Breadcrumb items={[
//     { label: 'Smartphones', href: '/categories/smartphones' },
//     { label: 'Apple', href: '/categories/smartphones/apple' },
//     { label: 'iPhone 13 Pro 256GB' },   ← no href = current page
//   ]} />
//
// Usage (dark/teal background):
//   <Breadcrumb items={[...]} dark />
// ============================================

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

export interface BreadcrumbItem {
    label: string
    href?: string // undefined = current page (rendered as plain text, not a link)
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
    dark?: boolean    // true when rendered on teal/dark hero backgrounds
    className?: string
}

export default function Breadcrumb({ items, dark = false, className = '' }: BreadcrumbProps) {
    // ── Colour tokens for light vs dark context ───────────────────
    const linkCls   = dark ? 'text-teal-300 hover:text-white' : 'text-gray-400 hover:text-teal-700'
    const activeCls = dark ? 'text-white font-medium'         : 'text-gray-700 font-medium'
    const divCls    = dark ? 'text-teal-600'                  : 'text-gray-300'

    return (
        <nav aria-label="Breadcrumb" className={`flex items-center flex-wrap gap-1 text-[12px] ${className}`}>
            {/* ── Home icon ── */}
            <Link href="/" aria-label="Home"
                className={`${linkCls} transition-colors flex items-center shrink-0`}>
                <HomeIcon className="w-3.5 h-3.5" />
            </Link>

            {/* ── Dynamic items ── */}
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                    <ChevronRightIcon className={`w-3 h-3 ${divCls} shrink-0`} />
                    {item.href ? (
                        <Link href={item.href}
                            className={`${linkCls} transition-colors`}>
                            {item.label}
                        </Link>
                    ) : (
                        <span className={activeCls}>{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    )
}