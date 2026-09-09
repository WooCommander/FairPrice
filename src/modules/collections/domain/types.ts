// Config-driven collection types (books / meds / ...).
// Each type describes the extra fields that live inside `CollectionItem.data`.

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean'

export interface FieldSpec {
    /** key inside item.data */
    key: string
    type: FieldType
    label: string
    placeholder?: string
    /** options for `select` */
    options?: string[]
    /** show a barcode-scan button next to the input (text fields only) */
    scan?: boolean
    /** render half-width in the form grid */
    half?: boolean
}

export interface SortOption {
    key: string
    label: string
}

export interface CollectionTypeConfig<TData = Record<string, unknown>> {
    /** stable key, stored in `collections.type` */
    key: string
    /** plural, for headings — "Книги" */
    label: string
    /** singular — "Книга" */
    itemLabel: string
    /** lucide icon name, resolved via config/icons.ts */
    icon: string
    /** default name offered when creating a collection of this type */
    defaultCollectionName: string
    /** placeholder for the built-in title field */
    titleHint: string
    /** placeholder for the built-in subtitle field ('' hides it) */
    subtitleHint: string
    /** type-specific fields stored in item.data */
    fields: FieldSpec[]
    /** card grid with covers, or a compact list */
    listLayout: 'grid' | 'list'
    /** build the line shown under the title in lists */
    formatSubtitle?: (item: { subtitle?: string | null; data: TData }) => string | undefined
    /** extra sort modes beyond the default (recent / title) */
    sortOptions?: SortOption[]
    /** predefined categories seeded on first use */
    starterCategories?: string[]
}
