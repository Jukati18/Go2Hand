// ============================================
// DEVICE WRITE SERVICE — write operations (CUD)
// Read operations live in deviceService.ts
//
// These functions run on the SERVER (Server Actions,
// API routes). They use the Supabase client with
// the user's session for RLS enforcement.
//
// Note: Supabase table is still named `products` at
// the DB level. Only the TypeScript layer uses "device".
// ============================================

import { supabase } from '@/lib/supabaseClient'
import type {
    CreateDeviceInput,
    UpdateDeviceInput,
    ListingStatus,
} from '@/types/deviceInput'

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — insert a new device listing
// Returns the new device's ID on success.
// ─────────────────────────────────────────────────────────────────────────────
export async function createDevice(
    sellerId: string,
    input: CreateDeviceInput
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
        .from('products')           // Supabase table name stays as-is
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
            status: 'active' as ListingStatus,
            is_verified: false,     // admin verifies later
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
// RLS on Supabase ensures only the seller can update their own listings.
// ─────────────────────────────────────────────────────────────────────────────
export async function updateDevice(
    deviceId: string,
    sellerId: string,
    input: UpdateDeviceInput
): Promise<void> {
    // Build only the fields that were provided (partial update).
    // We strip undefined values so we don't accidentally clear fields.
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
        .eq('id', deviceId)
        .eq('seller_id', sellerId)

    if (error) throw new Error(`Failed to update listing: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE (soft) — sets status to 'inactive' instead of hard delete.
// This preserves order history that references this device.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteDevice(
    deviceId: string,
    sellerId: string
): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({
            status: 'inactive' as ListingStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId)
        .eq('seller_id', sellerId)   // seller can only delete their own

    if (error) throw new Error(`Failed to delete listing: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK AS SOLD — called automatically when order is confirmed
// ─────────────────────────────────────────────────────────────────────────────
export async function markDeviceAsSold(deviceId: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .update({
            status: 'sold' as ListingStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId)

    if (error) throw new Error(`Failed to mark device as sold: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SELLER DEVICES — fetch all listings for a specific seller
// Used in the Seller Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export async function getSellerDevices(sellerId: string) {
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