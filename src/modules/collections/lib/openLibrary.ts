// Lightweight ISBN lookup via the public Open Library API.
// Used to pre-fill a book item after scanning a barcode.

export interface BookLookupResult {
    title?: string
    author?: string
    publisher?: string
    year?: number
    coverUrl?: string
}

const cleanIsbn = (raw: string) => raw.replace(/[^0-9Xx]/g, '')

export async function lookupIsbn(rawIsbn: string): Promise<BookLookupResult | null> {
    const isbn = cleanIsbn(rawIsbn)
    if (isbn.length !== 10 && isbn.length !== 13) return null

    try {
        const res = await fetch(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
        )
        if (!res.ok) return null
        const json = await res.json()
        const entry = json[`ISBN:${isbn}`]
        if (!entry) return null

        const yearMatch = String(entry.publish_date ?? '').match(/\d{4}/)
        return {
            title: entry.title,
            author: entry.authors?.map((a: any) => a.name).join(', ') || undefined,
            publisher: entry.publishers?.map((p: any) => p.name).join(', ') || undefined,
            year: yearMatch ? Number(yearMatch[0]) : undefined,
            coverUrl: entry.cover?.large || entry.cover?.medium || undefined,
        }
    } catch (e) {
        console.warn('ISBN lookup failed', e)
        return null
    }
}
