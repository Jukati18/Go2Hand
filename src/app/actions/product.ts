'use server'

// ============================================
// PRODUCT SERVER ACTIONS
//
// "use server" means Next.js runs these on the
// server, even when called from a client component.
// They handle: auth check → validate → call DB.
//
// How to use in a component:
//   import { actionCreateProduct } from '@/app/actions/product'
//   <form action={actionCreateProduct}>...</form>
//   // OR imperatively:
//   const result = await actionCreateProduct(formData)
// ============================================

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
    createProduct,
    updateProduct,
    deleteProduct,
} from '@/services/productService'
import type { CreateProductInput, UpdateProductInput } from '@/types/product'

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — get the currently logged-in user's ID
// Returns null if not authenticated
// ─────────────────────────────────────────────────────────────────────────────
async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: CREATE PRODUCT
//
// Called from the "Sell a Device" form.
// FormData keys map to CreateProductInput fields.
//
// Example form fields needed:
//   <input name="title" />
//   <input name="price" />
//   <input name="brand_id" />
//   etc.
// ─────────────────────────────────────────────────────────────────────────────
export async function actionCreateProduct(
    formData: FormData
): Promise<{ success: boolean; error?: string; productId?: string }> {
    // 1. Auth guard — must be logged in to list a device
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in to list a device' }
    }

    try {
        // 2. Parse FormData into typed input
        const input: CreateProductInput = {
            title: formData.get('title') as string,
            brand_id: formData.get('brand_id') as string,
            category_id: formData.get('category_id') as string,
            device_model_id: (formData.get('device_model_id') as string) || undefined,

            price: Number(formData.get('price')),
            original_price: Number(formData.get('original_price')),

            condition: formData.get('condition') as CreateProductInput['condition'],
            color: formData.get('color') as string,
            storage_capacity: formData.get('storage_capacity') as string,
            battery_health: Number(formData.get('battery_health')),

            // Images are uploaded separately; this receives their public URLs
            // The sell form should upload images first and store URLs in hidden inputs
            images: (formData.get('images') as string)
                .split(',')
                .map(url => url.trim())
                .filter(Boolean),

            imei_status: formData.get('imei_status') as 'clean' | 'flagged',
            icloud_status: formData.get('icloud_status') as 'unlocked' | 'locked',
            carrier_status: formData.get('carrier_status') as 'unlocked' | 'locked',

            // specs is sent as a JSON string from the form
            specs: JSON.parse((formData.get('specs') as string) || '{}'),
            description: (formData.get('description') as string) || undefined,
        }

        // 3. Run validation and insert
        const { id } = await createProduct(userId, input)

        // 4. Bust the Next.js cache for device listings
        revalidatePath('/devices')
        revalidatePath('/dashboard')

        return { success: true, productId: id }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: UPDATE PRODUCT
//
// Called from the "Edit Listing" form in the seller dashboard.
// Only changed fields need to be in FormData.
// ─────────────────────────────────────────────────────────────────────────────
export async function actionUpdateProduct(
    productId: string,
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in' }
    }

    try {
        // Build partial update — only include fields present in the form
        const input: UpdateProductInput = {}

        const title = formData.get('title') as string | null
        const price = formData.get('price') as string | null
        const originalPrice = formData.get('original_price') as string | null
        const condition = formData.get('condition') as string | null
        const color = formData.get('color') as string | null
        const storage = formData.get('storage_capacity') as string | null
        const battery = formData.get('battery_health') as string | null
        const images = formData.get('images') as string | null
        const description = formData.get('description') as string | null
        const status = formData.get('status') as string | null
        const specs = formData.get('specs') as string | null

        if (title) input.title = title
        if (price) input.price = Number(price)
        if (originalPrice) input.original_price = Number(originalPrice)
        if (condition) input.condition = condition as UpdateProductInput['condition']
        if (color) input.color = color
        if (storage) input.storage_capacity = storage
        if (battery) input.battery_health = Number(battery)
        if (description !== null) input.description = description || undefined
        if (status) input.status = status as UpdateProductInput['status']
        if (specs) input.specs = JSON.parse(specs)
        if (images) input.images = images.split(',').map(u => u.trim()).filter(Boolean)

        await updateProduct(productId, userId, input)

        // Bust the cache for this product's detail page + dashboard
        revalidatePath(`/devices/${productId}`)
        revalidatePath('/dashboard')

        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        return { success: false, error: message }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION: DELETE PRODUCT
//
// Soft-deletes by setting status = 'inactive'.
// Optionally redirects to dashboard after deletion.
// ─────────────────────────────────────────────────────────────────────────────
export async function actionDeleteProduct(
    productId: string
): Promise<{ success: boolean; error?: string }> {
    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, error: 'You must be logged in' }
    }

    try {
        await deleteProduct(productId, userId)

        revalidatePath('/devices')
        revalidatePath('/dashboard')

        return { success: true }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        return { success: false, error: message }
    }
}