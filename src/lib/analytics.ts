// src/lib/analytics.ts
// ─────────────────────────────────────────────────────────────────
// GA4 E-COMMERCE EVENT HELPERS
//
// Centralizes all gtag() calls so tracking logic isn't duplicated
// across components. Mirrors GA4's "Enhanced Ecommerce" schema:
//   https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
//
// Safe to call anywhere — window.gtag is optional-chained, so these
// are no-ops if GA hasn't loaded yet (ad blockers, slow init, etc).
// ─────────────────────────────────────────────────────────────────

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}

/** Shape of a single GA4 "item" — mirrors the fields we have on Device */
export interface GAItem {
    item_id: string
    item_name: string
    item_brand?: string
    item_category?: string
    price?: number
    quantity?: number
}

// ── VIEW ITEM — buyer lands on a device detail page ────────────────
export function trackViewItem(item: GAItem) {
    window.gtag?.('event', 'view_item', {
        currency: 'USD',
        value: item.price ?? 0,
        items: [item],
    })
}

// ── ADD TO CART — buyer adds a device to their cart ────────────────
export function trackAddToCart(item: GAItem) {
    window.gtag?.('event', 'add_to_cart', {
        currency: 'USD',
        value: item.price ?? 0,
        items: [item],
    })
}

// ── BEGIN CHECKOUT — buyer lands on the checkout page ───────────────
export function trackBeginCheckout(item: GAItem) {
    window.gtag?.('event', 'begin_checkout', {
        currency: 'USD',
        value: item.price ?? 0,
        items: [item],
    })
}

// ── PURCHASE — fires once, after a successful payment ───────────────
export function trackPurchase(params: {
    orderId: string
    value: number
    shipping?: number
    item: GAItem
}) {
    window.gtag?.('event', 'purchase', {
        transaction_id: params.orderId,
        value: params.value,
        shipping: params.shipping ?? 0,
        currency: 'USD',
        items: [params.item],
    })
}