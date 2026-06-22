// src/app/devices/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────
// Server Component — fetches device from Supabase, renders DetailPage.
//
// SEO additions (Week 10):
//  • Rich <title>  — brand · model · storage · grade
//  • Meta description — price, condition, battery, seller rating
//  • OpenGraph tags  — device image used as OG image for social sharing
//  • Twitter Card    — summary_large_image card
//  • canonical URL   — prevents duplicate-content issues
//  • JSON-LD (Product schema) — enables Google Rich Results (price, condition)
//  • JSON-LD (BreadcrumbList) — shows breadcrumb trail in search results
// ─────────────────────────────────────────────────────────────────

import type { Metadata }      from 'next'
import Script                  from 'next/script'
import { notFound }            from 'next/navigation'
import { getDeviceById, getSimilarDevices } from '@/services/deviceService'
import DeviceDetailClient      from '@/components/devices/DeviceDetailClient'
import { supabase }            from '@/lib/supabaseClient'
import { isInWatchlist }       from '@/actions/watchlist'
import {
    buildTitle,
    truncateDesc,
    buildOgImages,
    buildProductJsonLd,
    buildBreadcrumbJsonLd,
    conditionToSchema,
    conditionLabel,
    SITE_URL,
} from '@/lib/seo'

interface Props {
    params: Promise<{ id: string }>
}

// ─────────────────────────────────────────────────────────────────
// generateMetadata — called by Next.js at build / request time.
// This is where ALL <head> tags for SEO are set.
// ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const device = await getDeviceById(id)

    // If device not found, return minimal metadata (page will 404 anyway)
    if (!device) {
        return {
            title:       buildTitle(['Device Not Found']),
            description: 'This listing is no longer available on Go2Hand.',
        }
    }

    // ── Build rich description ────────────────────────────────────
    // Packs the most search-relevant facts into 155 chars:
    //   "Apple iPhone 15 Pro 256GB — Like New (Grade A+), 94% battery.
    //    Only $849 on Go2Hand. IMEI verified, escrow protected."
    const condLabel = conditionLabel(device.conditionLabel)
    const desc = truncateDesc(
        `${device.fullName} — ${condLabel} (Grade ${device.grade}), ` +
        `${device.batteryHealth}% battery. ` +
        `Only $${device.price} on Go2Hand. ` +
        `IMEI verified, escrow-protected purchase.`
    )

    // ── Canonical URL ─────────────────────────────────────────────
    const canonical = `${SITE_URL}/devices/${id}`

    // ── Keywords ─────────────────────────────────────────────────
    // Not a major ranking factor anymore, but still worth setting.
    const keywords = [
        `buy ${device.brand} ${device.model}`,
        `second hand ${device.brand}`,
        `used ${device.model} Vietnam`,
        `${device.brand} ${device.storage}`,
        `refurbished ${device.brand} ${device.model}`,
        'Go2Hand', 'second hand phone Vietnam',
    ].join(', ')

    const ogImage = device.images?.[0] ?? null

    return {
        // ── Title ─────────────────────────────────────────────────
        // Next.js sets both <title> and og:title from this.
        title: buildTitle([
            device.brand,
            device.model,
            device.storage,
            condLabel,
        ]),

        // ── Meta description ──────────────────────────────────────
        description: desc,

        // ── Keywords ─────────────────────────────────────────────
        keywords,

        // ── Robots ───────────────────────────────────────────────
        // Allow indexing. "noindex" only for admin/private pages.
        robots: {
            index:     true,
            follow:    true,
            googleBot: { index: true, follow: true },
        },

        // ── Canonical ─────────────────────────────────────────────
        // Prevents duplicate-content penalty if the same product
        // appears under multiple URLs.
        alternates: {
            canonical,
        },

        // ── OpenGraph ─────────────────────────────────────────────
        // Controls how the page appears when shared on Facebook,
        // LinkedIn, WhatsApp, iMessage, etc.
        openGraph: {
            type:        'website',
            url:         canonical,
            siteName:    'Go2Hand',
            title:       buildTitle([device.brand, device.model, device.storage]),
            description: desc,
            images:      buildOgImages(ogImage),
            locale:      'en_VN',
        },

        // ── Twitter Card ──────────────────────────────────────────
        // Controls appearance on X / Twitter when the link is shared.
        twitter: {
            card:        'summary_large_image',
            title:       buildTitle([device.brand, device.model, device.storage]),
            description: desc,
            images:      ogImage ? [ogImage] : undefined,
        },
    }
}

// ─────────────────────────────────────────────────────────────────
// PAGE — Server Component
// ─────────────────────────────────────────────────────────────────
export default async function DeviceDetailRoute({ params }: Props) {
    const { id } = await params

    // 1. Fetch main device
    const device = await getDeviceById(id)
    if (!device) notFound()

    // 2. Fetch similar devices (same category)
    const { data: product } = await supabase
        .from('products')
        .select('category_id')
        .eq('id', id)
        .single()

    const similarDevices = product?.category_id
        ? await getSimilarDevices(product.category_id, id, 4)
        : []

    // 3. Check watchlist for heart icon initial state
    const initialSaved = await isInWatchlist(id)

    // ── Build JSON-LD structured data ─────────────────────────────
    // JSON-LD is injected as an inline <script> in the <head>.
    // It does NOT appear visually — it's purely for search engines.
    const canonical = `${SITE_URL}/devices/${id}`

    // Product schema — enables price/condition/rating in Google search
    const productJsonLd = buildProductJsonLd({
        name:          device.fullName,
        description:
            `${conditionLabel(device.conditionLabel)} condition ${device.fullName}, ` +
            `${device.batteryHealth}% battery health. ` +
            `Grade ${device.grade}. ${device.imeiStatus === 'clean' ? 'IMEI clean.' : ''} ` +
            `Sold on Go2Hand with escrow buyer protection.`,
        imageUrl:      device.images?.[0] ?? '',
        price:         device.price,
        originalPrice: device.originalPrice,
        condition:     conditionToSchema(device.conditionLabel),
        brand:         device.brand,
        sku:           id,
        rating:        device.averageRating > 0 ? device.averageRating : undefined,
        reviewCount:   device.totalReviews > 0   ? device.totalReviews  : undefined,
        url:           canonical,
    })

    // Breadcrumb schema — shows "Go2Hand › Smartphones › Apple › iPhone 15 Pro" in Google
    const breadcrumbJsonLd = buildBreadcrumbJsonLd([
        { name: 'Go2Hand',          href: '/' },
        { name: device.category,    href: `/categories/${device.categorySlug}` },
        { name: device.brand,       href: `/categories/${device.categorySlug}/${device.brandSlug}` },
        { name: device.fullName,    href: `/devices/${id}` },
    ])

    return (
        <>
            {/*
                JSON-LD structured data — injected into <head> via next/script.
                "beforeInteractive" runs before the page hydrates so crawlers
                see it immediately. We use two separate <Script> tags so each
                schema object is independently parseable.
            */}
            <Script
                id="jsonld-product"
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: productJsonLd }}
                strategy="beforeInteractive"
            />
            <Script
                id="jsonld-breadcrumb"
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
                strategy="beforeInteractive"
            />

            <DeviceDetailClient
                device={device}
                similarDevices={similarDevices}
                initialSaved={initialSaved}
            />
        </>
    )
}