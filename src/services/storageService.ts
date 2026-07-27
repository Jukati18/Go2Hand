// src/services/storageService.ts
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'device-images'
const UPLOAD_TIMEOUT_MS = 25_000

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

// REMOVED: assertAuthenticated().
// It called supabase.auth.getSession() directly with NO timeout, ahead of
// every single photo upload. That call can deadlock via Supabase's
// navigator.locks-guarded session refresh queue (the same lock contention
// that caused the earlier SellDeviceForm hang) — and because it ran BEFORE
// withTimeout(...) wraps anything, a hang here was completely invisible to
// the 25s upload timeout below. It's redundant anyway: if the session is
// actually dead, supabase.storage.upload() rejects with its own auth error,
// and that call IS wrapped in withTimeout, so failures now surface in
// ≤25s with a clear message instead of hanging forever.

export async function uploadProductImage(
    file: File,
    productId: string,
    index: number
): Promise<string> {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `products/${productId}/${index}.${ext}`

    const { error } = await withTimeout<{ data: unknown; error: { message: string } | null }>(
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
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `avatars/${userId}.${ext}`

    const { error } = await withTimeout<{ data: unknown; error: { message: string } | null }>(
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
        const paths = files.map((f: { name: string }) => `products/${productId}/${f.name}`)
        await supabase.storage.from(BUCKET).remove(paths)
    }
}