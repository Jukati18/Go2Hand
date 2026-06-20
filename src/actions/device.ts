'use server'

// src/actions/device.ts
// ============================================
// DEVICE SERVER ACTIONS
//
// FIX: Multiple issues resolved:
//   1. formData.get('images') null-safety — was crashing with
//      "Cannot read properties of null (reading 'split')" when
//      the images key was missing or empty.
//   2. device_model_id empty string → now skipped if blank,
//      preventing Postgres UUID parse errors.
//   3. original_price and battery_health fallback values.
//   4. Better error messages returned to client.
//   5. Title required validation added.
// ============================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
    createDevice,
    updateDevice,
    deleteDevice,
} from '@/services/deviceWriteService'
import type { CreateDeviceInput, UpdateDeviceInput } from '@/types/deviceInput'

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — get the currently logged-in user's ID
// ─────────────────────────────────────────────────────────────────────────────
async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: CREATE DEVICE
// ─────────────────────────────────────────────────────────────────────────────
export async function actionCreateDevice(
    formData: FormData
): Promise<{ success: boolean; error?: string; deviceId?: string }> {
    // 1. Auth guard
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in to list a device' }
    }

    try {
        // 2. Parse required string fields
        const title       = (formData.get('title') as string | null)?.trim() ?? ''
        const brandId     = (formData.get('brand_id') as string | null)?.trim() ?? ''
        const categoryId  = (formData.get('category_id') as string | null)?.trim() ?? ''
        const condition   = (formData.get('condition') as string | null)?.trim() ?? ''
        const rawImages   = (formData.get('images') as string | null)?.trim() ?? ''

        // ── Validate required fields before hitting the DB ────────
        if (!title)      return { success: false, error: 'Listing title is required' }
        if (!brandId)    return { success: false, error: 'Brand is required' }
        if (!categoryId) return { success: false, error: 'Category is required' }
        if (!condition)  return { success: false, error: 'Device condition is required' }
        if (!rawImages)  return { success: false, error: 'At least one photo is required. Upload failed or no images were provided.' }

        // ── Parse image URLs — filter empties from split ──────────
        const images = rawImages
            .split(',')
            .map(url => url.trim())
            .filter(Boolean)

        if (images.length === 0) {
            return { success: false, error: 'No valid image URLs found. Please re-upload your photos.' }
        }

        // ── Parse price fields ────────────────────────────────────
        const price         = Number(formData.get('price') ?? 0)
        const originalPrice = Number(formData.get('original_price') ?? price) || price

        if (!price || price <= 0) {
            return { success: false, error: 'A valid selling price is required' }
        }

        // ── device_model_id: only include if a real UUID was given ─
        // An empty string causes a Postgres UUID parse error.
        const rawModelId = (formData.get('device_model_id') as string | null)?.trim()
        const deviceModelId = rawModelId && rawModelId.length > 0 ? rawModelId : undefined

        // ── Parse optional fields with safe defaults ──────────────
        const color           = (formData.get('color')           as string | null)?.trim() || 'Unknown'
        const storageCapacity = (formData.get('storage_capacity') as string | null)?.trim() || 'N/A'
        const batteryHealth   = Number(formData.get('battery_health') ?? 85) || 85
        const imeiStatus      = ((formData.get('imei_status')    as string | null) || 'clean') as 'clean' | 'flagged'
        const icloudStatus    = ((formData.get('icloud_status')  as string | null) || 'unlocked') as 'unlocked' | 'locked'
        const carrierStatus   = ((formData.get('carrier_status') as string | null) || 'unlocked') as 'unlocked' | 'locked'
        const description     = (formData.get('description')     as string | null)?.trim() || undefined

        // ── Parse specs JSON safely ───────────────────────────────
        let specs: Record<string, string> = {}
        try {
            const rawSpecs = formData.get('specs') as string | null
            if (rawSpecs) specs = JSON.parse(rawSpecs)
        } catch {
            // Non-fatal: bad JSON specs just means no specs
            console.warn('[actionCreateDevice] Failed to parse specs JSON — defaulting to {}')
        }

        // 3. Build typed input
        const input: CreateDeviceInput = {
            title,
            brand_id:          brandId,
            category_id:       categoryId,
            device_model_id:   deviceModelId,
            price,
            original_price:    originalPrice,
            condition:         condition as CreateDeviceInput['condition'],
            color,
            storage_capacity:  storageCapacity,
            battery_health:    batteryHealth,
            images,
            imei_status:       imeiStatus,
            icloud_status:     icloudStatus,
            carrier_status:    carrierStatus,
            specs,
            description,
        }

        // 4. Insert into DB
        const { id } = await createDevice(userId, input)

        // 5. Bust Next.js cache
        revalidatePath('/devices')
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/listings')

        return { success: true, deviceId: id }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        console.error('[actionCreateDevice] Error:', err)
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: UPDATE DEVICE
// ─────────────────────────────────────────────────────────────────────────────
export async function actionUpdateDevice(
    deviceId: string,
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in' }
    }

    try {
        const input: UpdateDeviceInput = {}

        const title       = formData.get('title')             as string | null
        const price       = formData.get('price')             as string | null
        const origPrice   = formData.get('original_price')    as string | null
        const condition   = formData.get('condition')         as string | null
        const color       = formData.get('color')             as string | null
        const storage     = formData.get('storage_capacity')  as string | null
        const battery     = formData.get('battery_health')    as string | null
        const images      = formData.get('images')            as string | null
        const description = formData.get('description')       as string | null
        const status      = formData.get('status')            as string | null
        const specs       = formData.get('specs')             as string | null

        if (title)       input.title           = title
        if (price)       input.price           = Number(price)
        if (origPrice)   input.original_price  = Number(origPrice)
        if (condition)   input.condition       = condition as UpdateDeviceInput['condition']
        if (color)       input.color           = color
        if (storage)     input.storage_capacity = storage
        if (battery)     input.battery_health  = Number(battery)
        if (description !== null) input.description = description || undefined
        if (status)      input.status          = status as UpdateDeviceInput['status']
        if (specs) {
            try { input.specs = JSON.parse(specs) } catch { /* skip */ }
        }
        if (images) {
            input.images = images.split(',').map(u => u.trim()).filter(Boolean)
        }

        await updateDevice(deviceId, userId, input)

        revalidatePath(`/devices/${deviceId}`)
        revalidatePath('/dashboard')

        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        console.error('[actionUpdateDevice] Error:', err)
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: DELETE DEVICE (soft-delete → status = 'inactive')
// ─────────────────────────────────────────────────────────────────────────────
export async function actionDeleteDevice(
    deviceId: string
): Promise<{ success: boolean; error?: string }> {
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in' }
    }

    try {
        await deleteDevice(deviceId, userId)

        revalidatePath('/devices')
        revalidatePath('/dashboard')

        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        console.error('[actionDeleteDevice] Error:', err)
        return { success: false, error: message }
    }
}