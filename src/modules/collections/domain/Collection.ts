export interface Collection {
    id: string
    owner_id: string
    type: string
    name: string
    icon: string | null
    created_at: string
    updated_at: string
    /** joined client-side: is the current user the owner (vs a share member) */
    is_owner?: boolean
    /** joined client-side: current user's role when the collection is shared with them */
    my_role?: 'editor' | 'viewer' | null
    /** joined client-side */
    item_count?: number
}

export interface CollectionInsertDTO {
    type: string
    name: string
    icon?: string | null
}

export interface CollectionUpdateDTO {
    name?: string
    icon?: string | null
}
