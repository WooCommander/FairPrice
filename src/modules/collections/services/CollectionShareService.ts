import { supabase } from '@/api/supabase'
import { authStore } from '@/modules/auth/store/authStore'
import type { CollectionShare, ShareInviteDTO, ShareRole } from '../domain/Share'

export class CollectionShareService {
    /** All shares for a collection (owner-only via RLS). */
    static async fetchShares(collectionId: string): Promise<CollectionShare[]> {
        const { data, error } = await supabase
            .from('collection_shares')
            .select('*')
            .eq('collection_id', collectionId)
            .order('created_at', { ascending: true })

        if (error) throw error
        return (data ?? []) as CollectionShare[]
    }

    static async invite(dto: ShareInviteDTO): Promise<CollectionShare> {
        const uid = authStore.user.value?.id
        if (!uid) throw new Error('Not authenticated')

        const email = dto.member_email.trim().toLowerCase()
        if (email === authStore.user.value?.email?.toLowerCase()) {
            throw new Error('Нельзя пригласить самого себя')
        }

        const { data, error } = await supabase
            .from('collection_shares')
            .insert({
                collection_id: dto.collection_id,
                owner_id: uid,
                member_email: email,
                role: dto.role,
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') throw new Error('Этот пользователь уже приглашён')
            throw error
        }
        return data as CollectionShare
    }

    static async updateRole(shareId: string, role: ShareRole): Promise<CollectionShare> {
        const { data, error } = await supabase
            .from('collection_shares')
            .update({ role })
            .eq('id', shareId)
            .select()
            .single()

        if (error) throw error
        return data as CollectionShare
    }

    static async revoke(shareId: string): Promise<void> {
        const { error } = await supabase.from('collection_shares').delete().eq('id', shareId)
        if (error) throw error
    }
}
