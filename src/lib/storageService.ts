// lib/storageService.ts — upload device photos to Supabase Storage
import { supabase } from './supabaseClient'

const BUCKET = 'device-images'

export async function uploadProductImage(
    file: File,
    productId: string,
    index: number
): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `products/${productId}/${index}.${ext}`

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    // Return the public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`

    const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

    if (error) throw new Error(error.message)

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
}

export async function deleteProductImages(productId: string) {
    // List all images for this product then delete them
    const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(`products/${productId}`)

    if (files?.length) {
        const paths = files.map(f => `products/${productId}/${f.name}`)
        await supabase.storage.from(BUCKET).remove(paths)
    }
}