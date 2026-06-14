// src/services/searchService.ts
// ─────────────────────────────────────────────────────────────────
// Search service for Navbar autocomplete and device search.
//
// Three suggestion types:
//   1. ModelSuggestion  — device model names from device_models table
//   2. SearchSuggestion — specific listings (products) matching query
//   3. CategoryQuickFilter — brands/categories for fast drill-down
//
// The dropdown renders all three in sequence so buyers can either:
//   A) Jump to a model page  (e.g. /categories/smartphones/apple?model=iPhone+15)
//   B) Jump to a listing     (e.g. /devices/[id])
//   C) Browse a brand/category
// ─────────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabaseClient'

// ── Listing suggestion (individual product) ───────────────────────
export interface SearchSuggestion {
    id: string
    title: string
    brand: string
    price: number
    imageUrl: string | null
    href: string
}

// ── Device model suggestion (from device_models table) ────────────
export interface ModelSuggestion {
    id: string
    modelName: string     // e.g. "iPhone 15 Pro"
    brandName: string     // e.g. "Apple"
    brandSlug: string     // e.g. "apple"
    categorySlug: string  // e.g. "smartphones"
    listingCount: number  // how many active listings
    href: string          // e.g. /categories/smartphones/apple?model=iPhone+15+Pro
}

// ── Quick-filter chip (brand within a category) ───────────────────
export interface QuickFilter {
    label: string    // e.g. "Apple Smartphones"
    sublabel: string // e.g. "148 listings"
    href: string
    icon?: string    // emoji or logo concept
}

// ─────────────────────────────────────────────────────────────────
// FETCH DEVICE MODEL SUGGESTIONS
// Searches device_models.model_name for the query.
// Returns up to `limit` results, ordered by listing count desc.
// ─────────────────────────────────────────────────────────────────
export async function getModelSuggestions(
    query: string,
    limit = 4
): Promise<ModelSuggestion[]> {
    const trimmed = query.trim()
    if (trimmed.length < 2) return []

    // Join device_models → brands → categories to get slugs
    // Also count active products per model for ranking
    const { data, error } = await supabase
        .from('device_models')
        .select(`
            id,
            model_name,
            brand:brands (
                id,
                name,
                slug,
                category:categories (
                    id,
                    name,
                    slug
                )
            )
        `)
        .ilike('model_name', `%${trimmed}%`)
        .limit(limit * 2) // fetch extra, we'll sort/trim in JS

    if (error || !data) return []

    // Build results, filtering out models without brand/category slugs
    const results: ModelSuggestion[] = []

    for (const row of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const brand = row.brand as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const category = brand?.category as any

        if (!brand?.slug || !category?.slug) continue

        const modelFilter = encodeURIComponent(row.model_name)
        results.push({
            id: row.id,
            modelName: row.model_name,
            brandName: brand.name ?? '',
            brandSlug: brand.slug,
            categorySlug: category.slug,
            listingCount: 0, // populated below
            href: `/categories/${category.slug}/${brand.slug}?model=${modelFilter}`,
        })
    }

    // Quick listing count per model (batch query)
    if (results.length > 0) {
        const modelIds = results.map(r => r.id)
        const { data: counts } = await supabase
            .from('products')
            .select('device_model_id')
            .eq('status', 'active')
            .in('device_model_id', modelIds)

        if (counts) {
            const countMap = counts.reduce<Record<string, number>>((acc, row) => {
                if (row.device_model_id) {
                    acc[row.device_model_id] = (acc[row.device_model_id] ?? 0) + 1
                }
                return acc
            }, {})
            results.forEach(r => { r.listingCount = countMap[r.id] ?? 0 })
        }
    }

    // Sort by listing count desc (most active models first), then slice
    return results
        .sort((a, b) => b.listingCount - a.listingCount)
        .slice(0, limit)
}

// ─────────────────────────────────────────────────────────────────
// FETCH LISTING SUGGESTIONS
// (same as before, kept for backward compatibility)
// ─────────────────────────────────────────────────────────────────
export async function getSearchSuggestions(
    query: string,
    limit = 5
): Promise<SearchSuggestion[]> {
    const trimmed = query.trim()
    if (trimmed.length < 2) return []

    const { data, error } = await supabase
        .from('products')
        .select(`
            id,
            title,
            price,
            images,
            brand:brands ( name )
        `)
        .eq('status', 'active')
        .ilike('title', `%${trimmed}%`)
        .order('view_count', { ascending: false })
        .limit(limit)

    if (error || !data) return []

    return data.map((row) => ({
        id: row.id,
        title: row.title ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        brand: (row.brand as any)?.name ?? '',
        price: Number(row.price) ?? 0,
        imageUrl: Array.isArray(row.images) && row.images.length > 0
            ? row.images[0]
            : null,
        href: `/devices/${row.id}`,
    }))
}

// ─────────────────────────────────────────────────────────────────
// COMBINED SEARCH — both models + listings in one call
// Returns { models, listings } for the dropdown to render.
// ─────────────────────────────────────────────────────────────────
export async function getCombinedSuggestions(query: string): Promise<{
    models: ModelSuggestion[]
    listings: SearchSuggestion[]
}> {
    const [models, listings] = await Promise.all([
        getModelSuggestions(query, 4),
        getSearchSuggestions(query, 4),
    ])
    return { models, listings }
}

// ─────────────────────────────────────────────────────────────────
// RECENT SEARCHES — localStorage helpers (unchanged)
// ─────────────────────────────────────────────────────────────────
const LS_KEY = 'go2hand_recent_searches'
const MAX_RECENT = 5

export function getRecentSearches(): string[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
        return []
    }
}

export function saveRecentSearch(term: string): void {
    if (typeof window === 'undefined' || !term.trim()) return
    try {
        const current = getRecentSearches()
        const updated = [
            term.trim(),
            ...current.filter((s) => s.toLowerCase() !== term.trim().toLowerCase()),
        ].slice(0, MAX_RECENT)
        localStorage.setItem(LS_KEY, JSON.stringify(updated))
    } catch { /* noop */ }
}

export function removeRecentSearch(term: string): string[] {
    const updated = getRecentSearches().filter(
        (s) => s.toLowerCase() !== term.toLowerCase()
    )
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(updated))
    } catch { /* noop */ }
    return updated
}