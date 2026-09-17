import { supabase } from '@/api/supabase'
import type {
    CollectionItem,
    CollectionItemInsertDTO,
    CollectionItemUpdateDTO,
} from '../domain/CollectionItem'

const normalize = (row: any): CollectionItem => ({
    ...row,
    photos: Array.isArray(row.photos) ? row.photos : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    data: row.data ?? {},
})

export class CollectionItemService {
    /** `page` loads items in batches (e.g. `{ offset, limit }`) — omit it to fetch everything. */
    static async fetchItems(
        collectionId: string,
        page?: { offset: number; limit: number },
    ): Promise<CollectionItem[]> {
        let query = supabase
            .from('collection_items')
            .select('*')
            .eq('collection_id', collectionId)
            .order('created_at', { ascending: false })

        if (page) query = query.range(page.offset, page.offset + page.limit - 1)

        const { data, error } = await query
        if (error) throw error
        return (data ?? []).map(normalize)
    }

    static async getItem(id: string): Promise<CollectionItem | null> {
        const { data, error } = await supabase
            .from('collection_items')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('getItem error', error)
            return null
        }
        return normalize(data)
    }

    static async createItem(dto: CollectionItemInsertDTO): Promise<CollectionItem> {
        const { data, error } = await supabase
            .from('collection_items')
            .insert({
                collection_id: dto.collection_id,
                title: dto.title,
                subtitle: dto.subtitle ?? null,
                cover_url: dto.cover_url ?? null,
                photos: dto.photos ?? [],
                category_id: dto.category_id ?? null,
                tags: dto.tags ?? [],
                quantity: dto.quantity ?? 1,
                location: dto.location ?? null,
                status: dto.status ?? null,
                price: dto.price ?? null,
                notes: dto.notes ?? null,
                data: dto.data ?? {},
            })
            .select()
            .single()

        if (error) throw error
        return normalize(data)
    }

    static async updateItem(id: string, updates: CollectionItemUpdateDTO): Promise<CollectionItem> {
        const { data, error } = await supabase
            .from('collection_items')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return normalize(data)
    }

    static async deleteItem(id: string): Promise<void> {
        const { error } = await supabase.from('collection_items').delete().eq('id', id)
        if (error) throw error
    }

    /**
     * Distinct existing values for one or more "справочник" fields (the built-in
     * `subtitle` column and/or `data` keys) across a collection's items — powers the
     * reference pickers (author/publisher/illustrator…) so they suggest what's already
     * been typed instead of a fixed config list.
     */
    static async fetchDistinctFieldValues(
        collectionId: string,
        keys: string[],
    ): Promise<Record<string, string[]>> {
        const result: Record<string, string[]> = {}
        for (const k of keys) result[k] = []
        if (!keys.length) return result

        const { data, error } = await supabase
            .from('collection_items')
            .select('subtitle, data')
            .eq('collection_id', collectionId)
        if (error) throw error

        const sets: Record<string, Set<string>> = {}
        for (const k of keys) sets[k] = new Set()
        for (const row of data ?? []) {
            for (const k of keys) {
                const v = k === 'subtitle' ? row.subtitle : (row.data ?? {})[k]
                if (typeof v === 'string' && v.trim()) sets[k].add(v.trim())
            }
        }
        for (const k of keys) result[k] = [...sets[k]].sort((a, b) => a.localeCompare(b))
        return result
    }

    /**
     * Rename or clear a "справочник" value (see `fetchDistinctFieldValues`) everywhere it's
     * used across a collection's items — e.g. renaming an author fixes it on every book that
     * has it, not just the one currently being edited. `newValue: null` clears the field.
     * Returns how many items were touched.
     */
    static async bulkSetFieldValue(
        collectionId: string,
        key: string,
        matchValue: string,
        newValue: string | null,
    ): Promise<number> {
        if (key === 'subtitle') {
            const { data, error } = await supabase
                .from('collection_items')
                .update({ subtitle: newValue, updated_at: new Date().toISOString() })
                .eq('collection_id', collectionId)
                .eq('subtitle', matchValue)
                .select('id')
            if (error) throw error
            return data?.length ?? 0
        }

        const { data: rows, error: selectError } = await supabase
            .from('collection_items')
            .select('id, data')
            .eq('collection_id', collectionId)
            .eq(`data->>${key}`, matchValue)
        if (selectError) throw selectError
        if (!rows?.length) return 0

        for (const row of rows) {
            const nextData = { ...(row.data ?? {}) }
            if (newValue === null) delete nextData[key]
            else nextData[key] = newValue
            const { error: updateError } = await supabase
                .from('collection_items')
                .update({ data: nextData, updated_at: new Date().toISOString() })
                .eq('id', row.id)
            if (updateError) throw updateError
        }
        return rows.length
    }
}
