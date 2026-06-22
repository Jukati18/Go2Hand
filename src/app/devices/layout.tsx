// src/app/devices/layout.tsx
// ─────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS:
//
// src/app/devices/page.tsx is a Client Component ('use client')
// because it uses useState/useEffect for filter state. Next.js only
// allows `export const metadata` or `export async function
// generateMetadata` in SERVER components.
//
// Solution: add a layout.tsx (which IS a server component) alongside
// the client page. Next.js merges metadata from layout + page, with
// the layout's values used as the base.
//
// This layout wraps /devices and all its children (/devices/[id]
// already has its own generateMetadata which will override these).
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { buildTitle, truncateDesc, SITE_URL } from '@/lib/seo'

// Static metadata for the /devices listing page.
// The /devices/[id] child page overrides this with device-specific data.
export const metadata: Metadata = {
    title: buildTitle(['Browse Verified Second-Hand Devices']),

    description: truncateDesc(
        'Buy verified second-hand smartphones, laptops, tablets and more on Go2Hand. ' +
        'Every device is IMEI-checked, condition-graded, and protected by escrow. ' +
        'Free shipping across Vietnam.'
    ),

    keywords: [
        'buy second hand phone Vietnam',
        'used smartphone Vietnam',
        'refurbished laptop Vietnam',
        'second hand tablet',
        'buy used iPhone Vietnam',
        'buy used Samsung Vietnam',
        'Go2Hand marketplace',
        'IMEI verified phones',
        'escrow phone purchase',
    ].join(', '),

    robots: {
        index:     true,
        follow:    true,
        googleBot: { index: true, follow: true },
    },

    alternates: {
        canonical: `${SITE_URL}/devices`,
    },

    openGraph: {
        type:        'website',
        url:         `${SITE_URL}/devices`,
        siteName:    'Go2Hand',
        title:       'Browse Verified Devices — Go2Hand',
        description: 'IMEI-verified, escrow-protected second-hand tech at the best prices.',
        locale:      'en_VN',
        images: [
            {
                url:    `${SITE_URL}/og-default.png`,
                width:  1200,
                height: 630,
                alt:    'Go2Hand — Browse Devices',
            },
        ],
    },

    twitter: {
        card:        'summary_large_image',
        title:       'Browse Verified Devices — Go2Hand',
        description: 'IMEI-verified, escrow-protected second-hand tech at the best prices.',
    },
}

// Pass-through layout — no visual wrapper needed.
// The Navbar/Footer are already in the root layout (src/app/layout.tsx).
export default function DevicesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}