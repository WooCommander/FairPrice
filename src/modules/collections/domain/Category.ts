export interface CollectionCategory {
    id: string
    collection_id: string
    name: string
    color: string | null
    icon: string | null
    sort: number
    created_at: string
}

export interface CategoryInsertDTO {
    collection_id: string
    name: string
    color?: string | null
    icon?: string | null
    sort?: number
}

export interface CategoryUpdateDTO {
    name?: string
    color?: string | null
    icon?: string | null
    sort?: number
}

// Reused from the notes module palette so categories feel consistent.
export const CATEGORY_COLORS = [
    '#fca5a5', // red
    '#fdba74', // orange
    '#fcd34d', // amber
    '#86efac', // green
    '#67e8f9', // cyan
    '#93c5fd', // blue
    '#c4b5fd', // violet
    '#f0abfc', // fuchsia
    '#d1d5db', // gray
]
