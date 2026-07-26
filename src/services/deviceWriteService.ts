// src/services/deviceWriteService.ts
// ============================================
// DEVICE WRITE SERVICE — write operations (CUD)
//
// FIX: Added validation for battery_health and other fields
// that must be positive numbers. Added better error messages.
// device_model_id undefined → null properly.
// ============================================

import { createClient } from '@/lib/supabase/server'
import type {
    CreateDeviceInput,
    UpdateDeviceInput,
    ListingStatus,
} from '@/types/deviceInput'
import * as Sentry from "@sentry/nextjs";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — insert a new device listing
// ─────────────────────────────────────────────────────────────────────────────
export async function createDevice(
    sellerId: string,
    input: CreateDeviceInput
): Promise<{ id: string }> {
    const supabase = await createClient()

    // Validate minimum required images
    if (!input.images || input.images.length === 0) {
        throw new Error('At least one image is required')
    }

    // Validate price
    if (input.price <= 0) {
        throw new Error('Price must be greater than 0')
    }

    // Validate battery_health is a sensible number (0–100)
    const batteryHealth = Math.max(0, Math.min(100, input.battery_health ?? 85))

    // Validate original_price — must be >= price (or equal for no discount)
    const originalPrice = Math.max(input.price, input.original_price ?? input.price)

    const { data, error } = await supabase
        .from('products')
        .insert({
            seller_id: sellerId,
            title: input.title.trim(),
            brand_id: input.brand_id,
            category_id: input.category_id,
            // undefined → null (no model selected)
            device_model_id: input.device_model_id ?? null,

            price: input.price,
            original_price: originalPrice,

            condition: input.condition,
            color: input.color.trim(),
            storage_capacity: input.storage_capacity,
            battery_health: batteryHealth,

            images: input.images,

            imei_status: input.imei_status,
            icloud_status: input.icloud_status,
            carrier_status: input.carrier_status,

            specs: input.specs ?? {},
            description: input.description?.trim() ?? null,

            // New listings start as active and not yet featured
            status: 'active' as ListingStatus,
            is_verified: false,
            is_featured: false,
            view_count: 0,
        })
        .select('id')
        .single()

    if (error) {
        console.error('[deviceWriteService.createDevice] Supabase error:', error)
        Sentry.captureException(new Error(error.message), {
            tags: { area: 'device_write', op: 'create' },
            extra: { sellerId },
        })
        throw new Error(`Failed to create listing: ${error.message}`)
    }

    return { id: data.id }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — edit fields on an existing listing
// ─────────────────────────────────────────────────────────────────────────────
export async function updateDevice(
    deviceId: string,
    sellerId: string,
    input: UpdateDeviceInput
): Promise<void> {
    const supabase = await createClient()

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
        .eq('id', deviceId)
        .eq('seller_id', sellerId) // only seller who owns it can update

    if (error) {
        console.error('[deviceWriteService.updateDevice] Supabase error:', error)
        Sentry.captureException(new Error(error.message), {
            tags: { area: 'device_write', op: 'update' },
            extra: { deviceId, sellerId },
        })
        throw new Error(`Failed to update listing: ${error.message}`)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE (soft) — sets status to 'inactive'
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteDevice(
    deviceId: string,
    sellerId: string
): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('products')
        .update({
            status: 'inactive' as ListingStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId)
        .eq('seller_id', sellerId)

    if (error) {
        console.error('[deviceWriteService.deleteDevice] Supabase error:', error)
        Sentry.captureException(new Error(error.message), {
            tags: { area: 'device_write', op: 'delete' },
            extra: { deviceId, sellerId },
        })
        throw new Error(`Failed to delete listing: ${error.message}`)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK AS SOLD
// ─────────────────────────────────────────────────────────────────────────────
export async function markDeviceAsSold(deviceId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('products')
        .update({
            status: 'sold' as ListingStatus,
            updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId)

    if (error) {
        console.error('[deviceWriteService.markDeviceAsSold] Supabase error:', error)
        Sentry.captureException(new Error(error.message), {
            tags: { area: 'device_write', op: 'mark_sold' },
            extra: { deviceId },
        })
        throw new Error(`Failed to mark device as sold: ${error.message}`)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET SELLER DEVICES — fetch all listings for a specific seller
// ─────────────────────────────────────────────────────────────────────────────
export async function getSellerDevices(sellerId: string) {
    const supabase = await createClient()

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
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[deviceWriteService.getSellerDevices] Supabase error:', error)
        Sentry.captureException(new Error(error.message), {
            tags: { area: 'device_write', op: 'list_seller_devices' },
            extra: { sellerId },
        })
        throw new Error(`Failed to fetch listings: ${error.message}`)
    }
    return data ?? []
}