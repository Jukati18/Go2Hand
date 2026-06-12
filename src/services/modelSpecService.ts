// src/services/modelSpecService.ts
// ─────────────────────────────────────────────────────────────────
// Fetches brands, device models, and auto-fill spec templates
// for the Sell Device form.
//
// The `specs` column on device_models (if it exists) stores JSON
// like { ram: "6GB", display: "6.1-inch OLED", chip: "A15 Bionic" }
// We use this to pre-populate the listing's specs field so sellers
// don't have to type everything from scratch.
// ─────────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabaseClient'

export interface BrandOption {
    id: string
    name: string
    slug: string
    logo_url: string | null
}

export interface CategoryOption {
    id: string
    name: string
    slug: string
}

export interface ModelOption {
    id: string
    model_name: string
    brand_id: string
    // Pre-defined specs stored in the DB (may be null for older entries)
    specs: Record<string, string> | null
    // Suggested retail price in USD (for pricing hint)
    suggested_retail_price?: number | null
}

// ── Fetch all active top-level categories ─────────────────────────
export async function getCategories(): Promise<CategoryOption[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .is('parent_id', null)
        .order('sort_order')

    if (error) return []
    return data ?? []
}

// ── Fetch all brands (with optional logo) ─────────────────────────
export async function getBrandsForSell(): Promise<BrandOption[]> {
    const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug, logo_url')
        .order('name')

    if (error) return []
    return data ?? []
}

// ── Fetch device models for a given brand ─────────────────────────
export async function getModelsForBrand(brandId: string): Promise<ModelOption[]> {
    const { data, error } = await supabase
        .from('device_models')
        .select('id, model_name, brand_id, specs, suggested_retail_price')
        .eq('brand_id', brandId)
        .order('model_name')

    if (error) return []
    return (data ?? []).map(row => ({
        id: row.id,
        model_name: row.model_name,
        brand_id: row.brand_id,
        specs: row.specs ?? null,
        suggested_retail_price: row.suggested_retail_price ?? null,
    }))
}

// ── Pricing suggestion based on condition ─────────────────────────
// Applies discount factors to the retail price per condition grade.
// Returns { min, max, suggested } in USD.
export function getPricingSuggestion(
    retailPrice: number | null | undefined,
    condition: string
): { min: number; max: number; suggested: number } | null {
    if (!retailPrice || retailPrice <= 0) return null

    // Discount multipliers per condition (from market research)
    const factors: Record<string, { min: number; max: number }> = {
        like_new:  { min: 0.75, max: 0.88 },
        excellent: { min: 0.60, max: 0.75 },
        good:      { min: 0.45, max: 0.62 },
        fair:      { min: 0.30, max: 0.48 },
    }

    const f = factors[condition]
    if (!f) return null

    const min = Math.round(retailPrice * f.min / 5) * 5   // round to nearest $5
    const max = Math.round(retailPrice * f.max / 5) * 5
    const suggested = Math.round((min + max) / 2 / 5) * 5

    return { min, max, suggested }
}