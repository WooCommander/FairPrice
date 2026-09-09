import { supabase } from '@/api/supabase'
import { authStore } from '@/modules/auth/store/authStore'
import type { Birthday } from '../domain/Birthday'
import type {
    BirthdayShare,
    BirthdayShareInviteDTO,
    BirthdayShareUpdateDTO,
} from '../domain/Share'

const normalizeShare = (row: any): BirthdayShare => ({
    id: row.id,
    owner_id: row.owner_id,
    owner_email: row.owner_email ?? null,
    member_email: row.member_email,
    member_id: row.member_id ?? null,
    scope: row.scope,
    created_at: row.created_at,
    birthday_ids: (row.birthday_share_items ?? []).map((i: any) => i.birthday_id),
})

export class BirthdayShareService {
    /** Attach pending email invitations to this user. */
    static async linkShares(): Promise<void> {
        const { error } = await supabase.rpc('link_my_birthday_shares')
        if (error) {
            console.error(
                `link_my_birthday_shares failed (${error.code}): ${error.message}. ` +
                    'Проверь, что db/birthday_shares.sql выполнен в Supabase.',
            )
        }
    }

    // ---- Owner side --------------------------------------------------

    static async fetchMyShares(): Promise<BirthdayShare[]> {
        const { data, error } = await supabase
            .from('birthday_shares')
            .select('*, birthday_share_items(birthday_id)')
            .order('created_at', { ascending: true })

        if (error) throw error
        return (data ?? []).map(normalizeShare)
    }

    static async invite(dto: BirthdayShareInviteDTO): Promise<BirthdayShare> {
        const uid = authStore.user.value?.id
        if (!uid) throw new Error('Not authenticated')

        const email = dto.member_email.trim().toLowerCase()
        if (email === authStore.user.value?.email?.toLowerCase()) {
            throw new Error('Нельзя пригласить самого себя')
        }

        const { data: share, error } = await supabase
            .from('birthday_shares')
            .insert({
                owner_id: uid,
                owner_email: authStore.user.value?.email ?? null,
                member_email: email,
                scope: dto.scope,
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') throw new Error('Этот пользователь уже приглашён')
            throw error
        }

        if (dto.scope === 'selected' && dto.birthday_ids.length) {
            await this.replaceItems(share.id, dto.birthday_ids)
        }

        return { ...normalizeShare(share), birthday_ids: dto.scope === 'selected' ? dto.birthday_ids : [] }
    }

    static async updateShare(id: string, dto: BirthdayShareUpdateDTO): Promise<void> {
        const { error } = await supabase
            .from('birthday_shares')
            .update({ scope: dto.scope })
            .eq('id', id)
        if (error) throw error

        await this.replaceItems(id, dto.scope === 'selected' ? dto.birthday_ids : [])
    }

    static async revoke(id: string): Promise<void> {
        const { error } = await supabase.from('birthday_shares').delete().eq('id', id)
        if (error) throw error
    }

    private static async replaceItems(shareId: string, birthdayIds: string[]): Promise<void> {
        const { error: delErr } = await supabase
            .from('birthday_share_items')
            .delete()
            .eq('share_id', shareId)
        if (delErr) throw delErr

        if (!birthdayIds.length) return
        const rows = birthdayIds.map(bid => ({ share_id: shareId, birthday_id: bid }))
        const { error: insErr } = await supabase.from('birthday_share_items').insert(rows)
        if (insErr) throw insErr
    }

    // ---- Member side ------------------------------------------------

    /** Birthdays other people have shared with me, each tagged with the owner's email. */
    static async fetchSharedWithMe(): Promise<Array<Birthday & { owner_email: string | null }>> {
        const uid = authStore.user.value?.id
        if (!uid) return []

        const [{ data: rows, error }, { data: shares }] = await Promise.all([
            supabase.from('birthdays').select('*').neq('user_id', uid),
            supabase.from('birthday_shares').select('owner_id, owner_email').eq('member_id', uid),
        ])
        if (error) throw error

        const emailByOwner = new Map<string, string | null>()
        for (const s of shares ?? []) emailByOwner.set(s.owner_id, s.owner_email ?? null)

        return (rows ?? []).map((b: any) => ({
            ...b,
            owner_email: emailByOwner.get(b.user_id) ?? null,
        }))
    }
}
