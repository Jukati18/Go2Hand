// lib/storageService.ts — upload device photos to Supabase Storage
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'device-images'
const UPLOAD_TIMEOUT_MS = 25_000 // hard ceiling so a stuck request can never hang the UI forever

/**
 * Race any promise against a timeout. This is the actual fix for the
 * "stuck at 5% forever" bug — previously the upload() call had nothing
 * forcing it to settle, so if the underlying fetch stalled, the await
 * in SellDeviceForm just sat there with no error and no progress.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(
                `${label} timed out after ${ms / 1000}s. Check your network connection, ` +
                `and confirm the "device-images" bucket's RLS policies don't have a ` +
                `path-based restriction that's silently rejecting this upload.`
            ))
        }, ms)

        promise
            .then((value) => { clearTimeout(timer); resolve(value) })
            .catch((err) => { clearTimeout(timer); reject(err) })
    })
}

/**
 * Fail fast if there's no live session, instead of letting upload()
 * attempt a request that RLS will reject (or that can stall while the
 * SDK tries to refresh an expired token).
 */
async function assertAuthenticated(): Promise<void> {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) {
        throw new Error('Your session has expired. Please sign in again and retry.')
    }
}

export async function uploadProductImage(
    file: File,
    productId: string,
    index: number
): Promise<string> {
    await assertAuthenticated()

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `products/${productId}/${index}.${ext}`

    const { error } = await withTimeout(
        supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type }),
        UPLOAD_TIMEOUT_MS,
        `Photo ${index + 1} upload`
    )

    if (error) throw new Error(`Upload failed: ${error.message}`)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    if (!data?.publicUrl) {
        throw new Error('Upload succeeded but no public URL was returned — confirm the bucket is set to Public.')
    }
    return data.publicUrl
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
    await assertAuthenticated()

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `avatars/${userId}.${ext}`

    const { error } = await withTimeout(
        supabase.storage.from('avatars').upload(path, file, { upsert: true }),
        UPLOAD_TIMEOUT_MS,
        'Avatar upload'
    )

    if (error) throw new Error(error.message)

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
}

export async function deleteProductImages(productId: string) {
    const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(`products/${productId}`)

    if (files?.length) {
        const paths = files.map(f => `products/${productId}/${f.name}`)
        await supabase.storage.from(BUCKET).remove(paths)
    }
}