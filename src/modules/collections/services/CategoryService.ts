import { supabase } from '@/api/supabase'
import type { CollectionCategory, CategoryInsertDTO, CategoryUpdateDTO } from '../domain/Category'
import { CATEGORY_COLORS } from '../domain/Category'

export class CategoryService {
    static async fetchCategories(collectionId: string): Promise<CollectionCategory[]> {
        const { data, error } = await supabase
            .from('collection_categories')
            .select('*')
            .eq('collection_id', collectionId)
            .order('sort', { ascending: true })
            .order('name', { ascending: true })

        if (error) throw error
        return (data ?? []) as CollectionCategory[]
    }

    static async createCategory(dto: CategoryInsertDTO): Promise<CollectionCategory> {
        const { data, error } = await supabase
            .from('collection_categories')
            .insert({
                collection_id: dto.collection_id,
                name: dto.name.trim(),
                color: dto.color ?? null,
                icon: dto.icon ?? null,
                sort: dto.sort ?? 0,
            })
            .select()
            .single()

        if (error) throw error
        return data as CollectionCategory
    }

    static async updateCategory(id: string, updates: CategoryUpdateDTO): Promise<CollectionCategory> {
        const { data, error } = await supabase
            .from('collection_categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data as CollectionCategory
    }

    static async deleteCategory(id: string): Promise<void> {
        const { error } = await supabase.from('collection_categories').delete().eq('id', id)
        if (error) throw error
    }

    /** Seed the predefined categories for a freshly created collection. */
    static async seedCategories(collectionId: string, names: string[]): Promise<CollectionCategory[]> {
        if (!names.length) return []
        const rows = names.map((name, i) => ({
            collection_id: collectionId,
            name,
            color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
            sort: i,
        }))
        const { data, error } = await supabase.from('collection_categories').insert(rows).select()
        if (error) throw error
        return (data ?? []) as CollectionCategory[]
    }
}
