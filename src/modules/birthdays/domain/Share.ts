export type BirthdayShareScope = 'all' | 'selected'

export interface BirthdayShare {
    id: string
    owner_id: string
    owner_email: string | null
    member_email: string
    member_id: string | null
    scope: BirthdayShareScope
    created_at: string
    /** joined client-side; meaningful only when scope === 'selected' */
    birthday_ids: string[]
}

export interface BirthdayShareInviteDTO {
    member_email: string
    scope: BirthdayShareScope
    birthday_ids: string[]
}

export interface BirthdayShareUpdateDTO {
    scope: BirthdayShareScope
    birthday_ids: string[]
}

export const BIRTHDAY_SCOPE_LABELS: Record<BirthdayShareScope, string> = {
    all: 'Все',
    selected: 'Выбранные',
}
