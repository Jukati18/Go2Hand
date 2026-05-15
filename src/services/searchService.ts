// src/services/searchService.ts
// ─────────────────────────────────────────────────────────────────
// Lightweight search used by the Navbar autocomplete.
// Intentionally separate from deviceService.ts — this query
// selects only the fields the dropdown needs (fast, small payload).
// ─────────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabaseClient'

export interface SearchSuggestion {
    id: string
    title: string       // e.g. "Apple iPhone 15 Pro 256GB"
    brand: string       // e.g. "Apple"
    price: number       // e.g. 899
    imageUrl: string | null
    href: string        // navigate to this on click
}

/**
 * Fetch up to `limit` device suggestions matching `query`.
 * Returns [] instantly for queries shorter than 2 characters
 * so we don't hammer Supabase on every keystroke.
 *
 * Ordered by view_count descending so popular devices surface first.
 */
export async function getSearchSuggestions(
    query: string,
    limit = 6
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

// ── Recent searches — localStorage helpers ────────────────────────
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
        // Move to front if already exists, then cap at MAX_RECENT
        const updated = [
            term.trim(),
            ...current.filter((s) => s.toLowerCase() !== term.trim().toLowerCase()),
        ].slice(0, MAX_RECENT)
        localStorage.setItem(LS_KEY, JSON.stringify(updated))
    } catch {
        // localStorage blocked in some browsers — fail silently
    }
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