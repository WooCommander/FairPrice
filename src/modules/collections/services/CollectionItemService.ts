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
    static async fetchItems(collectionId: string): Promise<CollectionItem[]> {
        const { data, error } = await supabase
            .from('collection_items')
            .select('*')
            .eq('collection_id', collectionId)
            .order('created_at', { ascending: false })

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
}
