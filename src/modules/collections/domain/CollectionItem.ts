export type ItemData = Record<string, unknown>

export interface CollectionItem {
    id: string
    collection_id: string
    created_by: string | null
    title: string
    subtitle: string | null
    cover_url: string | null
    photos: string[]
    category_id: string | null
    tags: string[]
    quantity: number
    location: string | null
    status: string | null
    price: number | null
    notes: string | null
    data: ItemData
    created_at: string
    updated_at: string
}

export interface CollectionItemInsertDTO {
    collection_id: string
    title: string
    subtitle?: string | null
    cover_url?: string | null
    photos?: string[]
    category_id?: string | null
    tags?: string[]
    quantity?: number
    location?: string | null
    status?: string | null
    price?: number | null
    notes?: string | null
    data?: ItemData
}

export interface CollectionItemUpdateDTO extends Partial<Omit<CollectionItemInsertDTO, 'collection_id'>> {}

export const ITEM_STATUSES = ['have', 'for_sale', 'wanted', 'low', 'expired'] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const ITEM_STATUS_LABELS: Record<string, string> = {
    have: 'В наличии',
    for_sale: 'На продажу',
    wanted: 'Хочу купить',
    low: 'Заканчивается',
    expired: 'Просрочено',
}
