import { supabase } from '@/api/supabase'
import { authStore } from '@/modules/auth/store/authStore'
import type { Collection, CollectionInsertDTO, CollectionUpdateDTO } from '../domain/Collection'

export class CollectionService {
    /** Attach pending email invitations to this user (no-op if RPC missing). */
    static async linkShares(): Promise<void> {
        const { error } = await supabase.rpc('link_my_shares')
        if (error) console.warn('link_my_shares failed:', error.message)
    }

    /** Map of collection_id -> role for collections shared with the current user. */
    private static async myRoles(): Promise<Record<string, 'editor' | 'viewer'>> {
        const uid = authStore.user.value?.id
        if (!uid) return {}
        const { data, error } = await supabase
            .from('collection_shares')
            .select('collection_id, role')
            .eq('member_id', uid)
        if (error) {
            console.warn('myRoles failed:', error.message)
            return {}
        }
        const map: Record<string, 'editor' | 'viewer'> = {}
        for (const row of data ?? []) map[row.collection_id] = row.role
        return map
    }

    static async fetchCollections(): Promise<Collection[]> {
        const uid = authStore.user.value?.id
        const [{ data, error }, roles] = await Promise.all([
            supabase
                .from('collections')
                .select('*, collection_items(count)')
                .order('created_at', { ascending: true }),
            this.myRoles(),
        ])

        if (error) throw error

        return (data ?? []).map((row: any) => ({
            ...row,
            is_owner: row.owner_id === uid,
            my_role: row.owner_id === uid ? null : roles[row.id] ?? null,
            item_count: row.collection_items?.[0]?.count ?? 0,
        })) as Collection[]
    }

    static async getCollection(id: string): Promise<Collection | null> {
        const uid = authStore.user.value?.id
        const { data, error } = await supabase
            .from('collections')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('getCollection error', error)
            return null
        }
        const isOwner = data.owner_id === uid
        let myRole: 'editor' | 'viewer' | null = null
        if (!isOwner) myRole = (await this.myRoles())[id] ?? null
        return { ...data, is_owner: isOwner, my_role: myRole } as Collection
    }

    static async createCollection(dto: CollectionInsertDTO): Promise<Collection> {
        const uid = authStore.user.value?.id
        if (!uid) throw new Error('Not authenticated')

        const { data, error } = await supabase
            .from('collections')
            .insert({ owner_id: uid, type: dto.type, name: dto.name, icon: dto.icon ?? null })
            .select()
            .single()

        if (error) throw error
        return { ...data, is_owner: true, item_count: 0 } as Collection
    }

    static async updateCollection(id: string, updates: CollectionUpdateDTO): Promise<Collection> {
        const { data, error } = await supabase
            .from('collections')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return { ...data, is_owner: true } as Collection
    }

    static async deleteCollection(id: string): Promise<void> {
        const { error } = await supabase.from('collections').delete().eq('id', id)
        if (error) throw error
    }
}
