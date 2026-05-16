// src/services/categoryService.ts
// ============================================
// CATEGORY SERVICE — all category/brand/model
// read queries for the hierarchical browse system.
//
// Hierarchy: Category (Smartphones)
//              └─ Brand (Apple)
//                   └─ Model (iPhone 13 Pro)
//                        └─ Listing (device detail)
// ============================================

import { supabase } from '../lib/supabaseClient'

// ─────────────────────────────────────────────────────────────────
// EXISTING FUNCTIONS (unchanged)
// ─────────────────────────────────────────────────────────────────

export async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .is('parent_id', null)          // top-level only
        .order('sort_order')

    if (error) throw new Error(error.message)
    return data ?? []
}

export async function getCategoryWithChildren(slug: string) {
    const { data, error } = await supabase
        .from('categories')
        .select('*, children:categories!parent_id (*)')
        .eq('slug', slug)
        .single()

    if (error) throw new Error(error.message)
    return data
}

export async function getBrands(popular = false) {
    let query = supabase.from('brands').select('*').order('name')
    if (popular) query = query.eq('is_popular', true)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data ?? []
}

export async function getDeviceModels(brandId: string) {
    const { data, error } = await supabase
        .from('device_models')
        .select('*')
        .eq('brand_id', brandId)
        .order('model_name')

    if (error) throw new Error(error.message)
    return data ?? []
}

// ─────────────────────────────────────────────────────────────────
// NEW: Get a single category by slug
// Used by category landing and brand pages for the breadcrumb + hero.
// ─────────────────────────────────────────────────────────────────
export async function getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, parent_id')
        .eq('slug', slug)
        .single()

    if (error) return null
    return data
}

// ─────────────────────────────────────────────────────────────────
// NEW: Get a single brand by slug
// ─────────────────────────────────────────────────────────────────
export async function getBrandBySlug(slug: string) {
    const { data, error } = await supabase
        .from('brands')
        .select('id, name, slug, logo_url, description')
        .eq('slug', slug)
        .single()

    if (error) return null
    return data
}

// ─────────────────────────────────────────────────────────────────
// NEW: Get brands that have active listings in a given category,
// sorted by listing count descending.
//
// Strategy: fetch all active product rows for the category (only
// brand_id + joined brand columns, so payload is small), then
// aggregate counts in JS. Avoids needing a DB view or RPC.
// ─────────────────────────────────────────────────────────────────
export interface BrandWithCount {
    id: string
    name: string
    slug: string
    logo_url: string | null
    count: number             // number of active listings
}

export async function getBrandsInCategory(categorySlug: string): Promise<BrandWithCount[]> {
    // 1. Resolve slug → category id
    const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

    if (!cat) return []

    // 2. Pull only brand FK + brand join columns for active products
    const { data, error } = await supabase
        .from('products')
        .select('brand_id, brand:brands ( id, name, slug, logo_url )')
        .eq('category_id', cat.id)
        .eq('status', 'active')

    if (error || !data) return []

    // 3. Aggregate counts in JS (products per brand)
    const map = new Map<string, BrandWithCount>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((row: any) => {
        const b = row.brand
        if (!b) return
        if (!map.has(b.id)) {
            map.set(b.id, {
                id: b.id,
                name: b.name,
                slug: b.slug,
                logo_url: b.logo_url ?? null,
                count: 0,
            })
        }
        map.get(b.id)!.count++
    })

    return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

// ─────────────────────────────────────────────────────────────────
// NEW: Get device models available for a specific brand + category.
// Used for the model-filter tabs on the brand page
// (e.g. iPhone 13 · iPhone 14 · iPhone 15).
// ─────────────────────────────────────────────────────────────────
export interface ModelWithCount {
    id: string
    model_name: string
    count: number
}

export async function getModelsInBrandCategory(
    brandSlug: string,
    categorySlug: string
): Promise<ModelWithCount[]> {
    // Resolve both slugs in parallel
    const [brandRes, catRes] = await Promise.all([
        supabase.from('brands').select('id').eq('slug', brandSlug).single(),
        supabase.from('categories').select('id').eq('slug', categorySlug).single(),
    ])

    if (!brandRes.data || !catRes.data) return []

    // Fetch device_model join for active products in this brand+category
    const { data, error } = await supabase
        .from('products')
        .select('device_model_id, device_model:device_models ( id, model_name )')
        .eq('brand_id', brandRes.data.id)
        .eq('category_id', catRes.data.id)
        .eq('status', 'active')
        .not('device_model_id', 'is', null)  // only products with a known model

    if (error || !data) return []

    // Aggregate counts in JS
    const map = new Map<string, ModelWithCount>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((row: any) => {
        const m = row.device_model
        if (!m) return
        if (!map.has(m.id)) {
            map.set(m.id, { id: m.id, model_name: m.model_name, count: 0 })
        }
        map.get(m.id)!.count++
    })

    return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

// ─────────────────────────────────────────────────────────────────
// NEW: Count active listings in a category (used in hero subtitle).
// Uses `head: true` so Supabase returns only the count, no rows.
// ─────────────────────────────────────────────────────────────────
export async function getCategoryDeviceCount(categorySlug: string): Promise<number> {
    const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

    if (!cat) return 0

    const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .eq('status', 'active')

    return count ?? 0
}