import type { CollectionTypeConfig } from '../domain/types'

export interface BookData {
    publisher?: string
    illustrator?: string
    city?: string
    year?: number
    isbn?: string
}

export const booksType: CollectionTypeConfig<BookData> = {
    key: 'books',
    label: 'Книги',
    itemLabel: 'Книга',
    icon: 'BookOpen',
    defaultCollectionName: 'Моя библиотека',
    titleHint: 'Название книги',
    subtitleHint: 'Автор',
    // author is a "справочник" (see FieldType) — picked from authors already used in
    // this catalog, not typed fresh (and not duplicated as a separate data.author field)
    subtitleAsReference: true,
    listLayout: 'grid',
    fields: [
        // full-width: publisher/illustrator names run long and don't fit half-width
        { key: 'publisher', type: 'reference', label: 'Издательство', labelInside: true },
        { key: 'illustrator', type: 'reference', label: 'Иллюстратор' },
        { key: 'city', type: 'reference', label: 'Город', half: true },
        { key: 'year', type: 'number', label: 'Год', half: true },
        // ISBN dropped for now (scan/lookup UI needs its own pass)
    ],
    formatSubtitle: ({ subtitle, data }) => {
        const parts = [subtitle, data.year ? String(data.year) : undefined]
        return parts.filter(Boolean).join(' · ') || undefined
    },
    sortOptions: [
        { key: 'subtitle', label: 'По автору' },
        { key: 'year', label: 'По году' },
    ],
    starterCategories: [
        'Проза', 'Нон-фикшн', 'Фантастика', 'История', 'Детское', 'Поэзия', 'Справочники', 'Комиксы',
    ],
}
