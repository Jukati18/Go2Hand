// src/app/sitemap.ts
// ─────────────────────────────────────────────────────────────────
// Dynamic sitemap generator — Next.js App Router
//
// Auto-generates /sitemap.xml at build time (static export) or
// on first request (ISR / server render).
//
// Three tiers of URLs:
//   1. STATIC  — pages that never change (homepage, about, etc.)
//   2. DYNAMIC — category + brand pages (fetched from Supabase)
//   3. DYNAMIC — individual device listings (fetched from Supabase)
//
// Priority & changeFreq guide (rough heuristics):
//   1.0  → homepage only
//   0.9  → category landing pages
//   0.8  → brand-in-category pages
//   0.7  → active device detail pages
//   0.5  → static info pages (about, faq, etc.)
//
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
// ─────────────────────────────────────────────────────────────────

import type { MetadataRoute } from 'next'
import { SITE_URL }           from '@/lib/seo'
import { supabaseAdmin }      from '@/lib/supabase/admin'

// ── Helper: build a full URL from a path ─────────────────────────
function url(path: string): string {
    return `${SITE_URL}${path}`
}

// ── Today's date (for lastModified on static pages) ───────────────
const TODAY = new Date()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

    // ──────────────────────────────────────────────────────────────
    // 1. STATIC PAGES
    //    These don't change often, so changeFrequency is low/monthly.
    // ──────────────────────────────────────────────────────────────
    const staticPages: MetadataRoute.Sitemap = [
        {
            url:            url('/'),
            lastModified:   TODAY,
            changeFrequency: 'daily',   // new featured devices rotate daily
            priority:       1.0,
        },
        {
            url:            url('/devices'),
            lastModified:   TODAY,
            changeFrequency: 'hourly',  // listings change constantly
            priority:       0.9,
        },

        // ── Category landing pages ─────────────────────────────────
        // Hard-coded because categories are rarely added/removed.
        ...([
            'smartphones',
            'laptops',
            'tablets',
            'watches',
            'audio',
            'desktops',
        ].map(cat => ({
            url:             url(`/categories/${cat}`),
            lastModified:    TODAY,
            changeFrequency: 'weekly' as const,
            priority:        0.9,
        }))),

        // ── Static info pages ─────────────────────────────────────
        ...([
            '/about',
            '/how-it-works',
            '/buyer-protection',
            '/seller-guidelines',
            '/condition-guide',
            '/faq',
            '/contact',
            '/trust',
            '/fees',
            '/get-verified',
            '/privacy',
            '/terms',
        ].map(path => ({
            url:             url(path),
            lastModified:    TODAY,
            changeFrequency: 'monthly' as const,
            priority:        0.5,
        }))),
    ]

    // ──────────────────────────────────────────────────────────────
    // 2. DYNAMIC: Category → Brand pages
    //    e.g. /categories/smartphones/apple
    //
    //    We join products → brands → categories to get only brand+category
    //    combinations that actually have active listings (no ghost pages).
    // ──────────────────────────────────────────────────────────────
    let brandPages: MetadataRoute.Sitemap = []

    try {
        // Pull distinct (category_slug, brand_slug) pairs from active products.
        // Using supabaseAdmin so we bypass RLS without needing a user session.
        const { data: brandCatRows } = await supabaseAdmin
            .from('products')
            .select(`
                brand:brands ( slug ),
                category:categories ( slug )
            `)
            .eq('status', 'active')
            .not('brand_id', 'is', null)
            .not('category_id', 'is', null)

        if (brandCatRows) {
            // Deduplicate: many products share the same brand+category
            const seen = new Set<string>()

            brandPages = brandCatRows
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((row: any) => {
                    const key = `${row.category?.slug}/${row.brand?.slug}`
                    if (!row.category?.slug || !row.brand?.slug || seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((row: any) => ({
                    url:             url(`/categories/${row.category.slug}/${row.brand.slug}`),
                    lastModified:    TODAY,
                    changeFrequency: 'daily' as const,
                    priority:        0.8,
                }))
        }
    } catch (err) {
        // Non-fatal — sitemap still works with just static pages
        console.error('[sitemap] Failed to fetch brand pages:', err)
    }

    // ──────────────────────────────────────────────────────────────
    // 3. DYNAMIC: Individual device listings
    //    e.g. /devices/uuid-goes-here
    //
    //    We only include ACTIVE listings (sold/inactive have no
    //    value in the sitemap — returning a 404 or redirect would
    //    waste crawl budget).
    //
    //    Large catalogues (>50k products) should use multiple sitemap
    //    files via generateSitemaps(). For MVP this single file is fine.
    // ──────────────────────────────────────────────────────────────
    let devicePages: MetadataRoute.Sitemap = []

    try {
        const { data: products } = await supabaseAdmin
            .from('products')
            .select('id, updated_at')
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            // Limit to 5,000 for the MVP — well within Google's 50k/sitemap limit.
            // Implement generateSitemaps() when catalogue exceeds this.
            .limit(5000)

        if (products) {
            devicePages = products.map(product => ({
                url:             url(`/devices/${product.id}`),
                // Use the real DB timestamp so Google knows when each
                // listing was last edited (price change, photo update, etc.)
                lastModified:    new Date(product.updated_at),
                changeFrequency: 'weekly' as const,
                priority:        0.7,
            }))
        }
    } catch (err) {
        console.error('[sitemap] Failed to fetch device pages:', err)
    }

    // ──────────────────────────────────────────────────────────────
    // Merge all tiers and return.
    // Order: static first (homepage priority 1.0), then brand pages,
    // then device pages (most numerous, lower priority).
    // ──────────────────────────────────────────────────────────────
    return [
        ...staticPages,
        ...brandPages,
        ...devicePages,
    ]
}