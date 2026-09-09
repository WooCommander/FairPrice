import { supabase } from '@/api/supabase'
import { authStore } from '@/modules/auth/store/authStore'

const BUCKET = 'collection-photos'
const MAX_DIMENSION = 1400
const JPEG_QUALITY = 0.82

/** Downscale + re-encode a picked image to keep uploads small. */
async function compress(file: File): Promise<Blob> {
    if (!file.type.startsWith('image/')) return file
    const bitmap = await createImageBitmap(file).catch(() => null)
    if (!bitmap) return file

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    return new Promise<Blob>(resolve => {
        canvas.toBlob(
            blob => resolve(blob ?? file),
            'image/jpeg',
            JPEG_QUALITY,
        )
    })
}

/** Upload one image, return its public URL. */
export async function uploadItemPhoto(file: File): Promise<string> {
    const uid = authStore.user.value?.id ?? 'anon'
    const blob = await compress(file)
    const path = `${uid}/${crypto.randomUUID()}.jpg`

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
}

export async function uploadItemPhotos(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const f of files) urls.push(await uploadItemPhoto(f))
    return urls
}
