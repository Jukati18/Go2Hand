// lib/categoryService.ts
import { supabase } from './supabaseClient'

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