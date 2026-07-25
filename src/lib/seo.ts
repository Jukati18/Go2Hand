// src/lib/seo.ts
// ─────────────────────────────────────────────────────────────────
// Shared SEO utilities for Go2Hand.
//
// Centralising metadata generation here means:
//  • consistent title/description format across all pages
//  • one place to update when the brand name changes
//  • easy reuse of JSON-LD schema builders
// ─────────────────────────────────────────────────────────────────

// ── Site-wide constants ───────────────────────────────────────────
export const SITE_NAME    = 'Go2Hand'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://go2hand.vn'
export const SITE_TAGLINE = "Vietnam's Trusted Second-Hand Marketplace"
export const TWITTER_HANDLE = '@go2handvn'                // update when account exists

// ── Title formatter ───────────────────────────────────────────────
// Produces:  "Apple iPhone 15 Pro 256GB Space Black — Go2Hand"
export function buildTitle(parts: string[]): string {
    return [...parts.filter(Boolean), SITE_NAME].join(' — ')
}

// ── Description length guard ──────────────────────────────────────
// Google truncates descriptions after ~155 chars. We clamp here so
// meta tags always look good in search results.
export function truncateDesc(text: string, maxLen = 155): string {
    if (text.length <= maxLen) return text
    return text.slice(0, maxLen - 1) + '…'
}

// ── OpenGraph image helper ────────────────────────────────────────
// Returns a typed OG image array for Next.js Metadata.
// Falls back to the site default OG image when no device image exists.
export function buildOgImages(imageUrl?: string | null): {
    url: string
    width: number
    height: number
    alt: string
}[] {
    const fallback = `${SITE_URL}/og-default.png`   // put a 1200×630 image here
    return [
        {
            url:    imageUrl ?? fallback,
            width:  1200,
            height: 630,
            alt:    SITE_NAME,
        },
    ]
}

// ── JSON-LD: Product schema (Google Rich Results) ─────────────────
// Tells Google this page represents a purchasable product — can
// unlock star ratings, price, and availability in search results.
//
// Docs: https://schema.org/Product
// Test: https://search.google.com/test/rich-results
export interface ProductSchemaProps {
    name:          string          // full device title
    description:   string
    imageUrl:      string          // first device photo
    price:         number          // asking price in USD
    originalPrice: number          // retail price (for "was" markup)
    condition:     'NewCondition' | 'RefurbishedCondition' | 'UsedCondition'
    brand:         string
    sku:           string          // device listing ID
    rating?:       number          // 0–5
    reviewCount?:  number
    url:           string          // canonical URL for this listing
}

export function buildProductJsonLd(props: ProductSchemaProps): string {
    const schema: Record<string, unknown> = {
        '@context':    'https://schema.org',
        '@type':       'Product',
        name:          props.name,
        description:   props.description,
        image:         props.imageUrl,
        sku:           props.sku,
        brand: {
            '@type': 'Brand',
            name:    props.brand,
        },
        offers: {
            '@type':         'Offer',
            url:             props.url,
            priceCurrency:   'USD',
            price:           props.price.toFixed(2),
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                .toISOString().split('T')[0],     // 30 days from now
            itemCondition:   `https://schema.org/${props.condition}`,
            availability:    'https://schema.org/InStock',
            seller: {
                '@type': 'Organization',
                name:    SITE_NAME,
            },
        },
    }

    // Only add aggregateRating when we have real data — Google penalises
    // fake or placeholder ratings.
    if (props.rating && props.reviewCount && props.reviewCount > 0) {
        schema.aggregateRating = {
            '@type':       'AggregateRating',
            ratingValue:   props.rating.toFixed(1),
            reviewCount:   props.reviewCount,
            bestRating:    '5',
            worstRating:   '1',
        }
    }

    return JSON.stringify(schema)
}

// ── JSON-LD: BreadcrumbList schema ────────────────────────────────
// Adds breadcrumb rich results in Google — e.g.
//   Go2Hand › Smartphones › Apple › iPhone 15 Pro
//
// Docs: https://schema.org/BreadcrumbList
export interface BreadcrumbItem {
    name: string
    href: string
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): string {
    const schema = {
        '@context':        'https://schema.org',
        '@type':           'BreadcrumbList',
        itemListElement:   items.map((item, i) => ({
            '@type':   'ListItem',
            position:  i + 1,
            name:      item.name,
            item:      `${SITE_URL}${item.href}`,
        })),
    }
    return JSON.stringify(schema)
}

// ── Condition mapper ──────────────────────────────────────────────
// Maps our DB condition values to schema.org ItemCondition types.
export function conditionToSchema(
    condition: string
): 'NewCondition' | 'RefurbishedCondition' | 'UsedCondition' {
    if (condition === 'like_new') return 'RefurbishedCondition'
    return 'UsedCondition'
}

// ── Condition to human label ──────────────────────────────────────
export function conditionLabel(condition: string): string {
    const map: Record<string, string> = {
        like_new:  'Like New',
        excellent: 'Excellent',
        good:      'Good',
        fair:      'Fair',
    }
    return map[condition] ?? condition
}