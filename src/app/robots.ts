// src/app/robots.ts
// ─────────────────────────────────────────────────────────────────
// robots.txt generator — Next.js App Router
//
// This file auto-generates /robots.txt at build time (or on request).
// No manual file needed — Next.js serves the output at /robots.txt.
//
// Rules:
//   • Allow all public pages (homepage, devices, categories, profiles)
//   • Block private/auth pages from indexing (dashboard, checkout, cart)
//   • Block API routes (no benefit indexing these)
//   • Point crawlers to the sitemap location
//
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
// ─────────────────────────────────────────────────────────────────

import type { MetadataRoute } from 'next'
import { SITE_URL }           from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                // Standard web crawlers (Google, Bing, etc.)
                userAgent: '*',

                allow: [
                    '/',                    // homepage
                    '/devices/',            // device listing pages
                    '/categories/',         // category & brand pages
                    '/profile/',            // public seller profiles
                    '/how-it-works',
                    '/buyer-protection',
                    '/seller-guidelines',
                    '/condition-guide',
                    '/about',
                    '/faq',
                    '/contact',
                    '/trust',
                    '/fees',
                    '/blog/',
                    '/privacy',
                    '/terms',
                    '/get-verified',
                ],

                disallow: [
                    // ── Auth & account pages ──────────────────────
                    '/login',
                    '/signup',
                    '/forgot-password',
                    '/auth/',               // OAuth callback routes

                    // ── Private user pages ────────────────────────
                    '/dashboard/',          // seller/buyer dashboards
                    '/orders/',             // individual order detail
                    '/cart',
                    '/checkout/',
                    '/watchlist',           // personal saved devices
                    '/sell',                // listing creation form
                    '/settings',

                    // ── API & internal routes ─────────────────────
                    '/api/',                // all REST API endpoints
                ],
            },

            // Disallow AI training crawlers (common best practice)
            {
                userAgent: 'GPTBot',
                disallow: ['/'],
            },
            {
                userAgent: 'ChatGPT-User',
                disallow: ['/'],
            },
            {
                userAgent: 'CCBot',
                disallow: ['/'],
            },
        ],

        // Tells crawlers where to find the full list of URLs.
        // Googlebot will fetch this automatically after reading robots.txt.
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}