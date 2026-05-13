// ============================================
// PRODUCT SERVICE — write operations (CUD)
// Read operations live in deviceService.ts
//
// These functions run on the SERVER (Server Actions,
// API routes). They use the Supabase client with
// the user's session for RLS enforcement.
// ============================================

import { supabase } from '@/lib/supabaseClient'
import type {
    CreateProductInput,
    UpdateProductInput,
    ProductStatus,
} from '@/types/product'

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — insert a new device listing
// Returns the new product's ID on success.
// ─────────────────────────────────────────────────────────────────────────────
export async function createProduct(
    sellerId: string,
    input: CreateProductInput
): Promise<{ id: string }> {
    // Validate minimum required images
    if (!input.images || input.images.length === 0) {
        throw new Error('At least one image is required')
    }

    // Validate price
    if (input.price <= 0) {
        throw new Error('Price must be greater than 0')
    }

    const { data, error } = await supabase
        .from('products')
        .insert({
            seller_id: sellerId,
            title: input.title.trim(),
            brand_id: input.brand_id,
            category_id: input.category_id,
            device_model_id: input.device_model_id ?? null,

            price: input.price,
            original_price: input.original_price,

            condition: input.condition,
            color: input.color.trim(),
            storage_capacity: input.storage_capacity,
            battery_health: input.battery_health,

            images: input.images,

            imei_status: input.imei_status,
            icloud_status: input.icloud_status,
            carrier_status: input.carrier_status,

            specs: input.specs ?? {},
            description: input.description?.trim() ?? null,

            // New listings start as active and not yet featured
            status: 'active' as ProductStatus,
            is_verified: false,       // admin verifies later
            is_featured: false,
            view_count: 0,
        })
        .select('id')
        .single()

    if (error) throw new Error(`Failed to create listing: ${error.message}`)
    return { id: data.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — edit fields on an existing listing
// RLS on Supabase ensures only the seller can update their own products.
// ─────────────────────────────────────────────────────────────────────────────
export async function updateProduct(
    productId: string,
    sellerId: string,
    input: UpdateProductInput
): Promise<void> {
    // Build only the fields that were provided (partial update)
    // We strip undefined values so we don't accidentally clear fields
    const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    }

    if (input.title !== undefined) updates.title = input.title.trim()
    if (input.price !== undefined) updates.price = input.price
    if (input.original_price !== undefined) updates.original_price = input.original_price
    if (input.condition !== undefined) updates.condition = input.condition
    if (input.color !== undefined) updates.color = input.color.trim()
    if (input.storage_capacity !== undefined) updates.storage_capacity = input.storage_capacity
    if (input.battery_health !== undefined) updates.battery_health = input.battery_health
    if (input.images !== undefined) updates.images = input.images
    if (input.imei_status !== undefined) updates.imei_status = input.imei_status
    if (input.icloud_status !== undefined) updates.icloud_status = input.icloud_status
    if (input.carrier_status !== undefined) updates.carrier_status = input.carrier_status
    if (input.specs !== undefined) updates.specs = input.specs
    if (input.description !== undefined) updates.description = input.description?.trim() ?? null
    if (input.status !== undefined) updates.status = input.status

    const { error } = await supabase
        .from('products')
        .update(updates)
        // Double-check: only the seller who owns it can update
        .eq('id', productId)
        .eq('seller_id', sellerId)

    if (error) throw new Error(`Failed to update listing: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE (soft) — sets status to 'inactive' instead of hard delete.
// This preserves order history that references this product.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteProduct(
    productId: string,
    sellerId: string
): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({
            status: 'inactive' as ProductStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('seller_id', sellerId)   // seller can only delete their own

    if (error) throw new Error(`Failed to delete listing: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK AS SOLD — called automatically when order is confirmed
// ─────────────────────────────────────────────────────────────────────────────
export async function markProductAsSold(productId: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({
            status: 'sold' as ProductStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', productId)

    if (error) throw new Error(`Failed to mark product as sold: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SELLER LISTINGS — fetch all listings for a specific seller
// Used in the Seller Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export async function getSellerListings(sellerId: string) {
    const { data, error } = await supabase
        .from('products')
        .select(`
        id, title, price, original_price, condition, status,
        images, storage_capacity, color, battery_health,
        view_count, is_verified, is_featured,
        created_at, updated_at,
        brand:brands ( id, name ),
        category:categories ( id, name )
    `)
        .eq('seller_id', sellerId)
        // Show all statuses so seller can see sold/inactive too
        .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch listings: ${error.message}`)
    return data ?? []
}