// Config-driven collection types (books / meds / ...).
// Each type describes the extra fields that live inside `CollectionItem.data`.

// 'select': fixed options, listed in config.
// 'reference': a "справочник" — options aren't fixed; they're the distinct values already
// used for this key across the collection's items (e.g. publisher, illustrator), fetched
// live and offered via a searchable picker that also lets you type a new one.
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'reference' | 'textarea' | 'boolean'

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
    /** for `select`/`reference`: render the label inside the picker box (stacked, like a
     * caption) instead of above it — a standalone full-width field can afford this more
     * compact look, but a field paired with a neighbour (e.g. half + half) should leave
     * this off so both boxes' top edges still line up (see FpMobilePicker's `labelInside`) */
    labelInside?: boolean
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
    /** render the built-in subtitle field as a "справочник" picker (see FieldType) instead of plain text */
    subtitleAsReference?: boolean
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
