export type ShareRole = 'editor' | 'viewer'

export interface CollectionShare {
    id: string
    collection_id: string
    owner_id: string
    member_email: string
    member_id: string | null
    role: ShareRole
    created_at: string
}

export interface ShareInviteDTO {
    collection_id: string
    member_email: string
    role: ShareRole
}

export const SHARE_ROLE_LABELS: Record<ShareRole, string> = {
    editor: 'Редактор',
    viewer: 'Просмотр',
}

export const SHARE_ROLE_HINTS: Record<ShareRole, string> = {
    editor: 'Может добавлять и редактировать',
    viewer: 'Может только смотреть',
}
