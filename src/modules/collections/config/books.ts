import type { CollectionTypeConfig } from '../domain/types'

export interface BookData {
    author?: string
    publisher?: string
    edition?: string
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
    listLayout: 'grid',
    fields: [
        { key: 'author', type: 'text', label: 'Автор', half: true },
        { key: 'publisher', type: 'text', label: 'Издательство', half: true },
        { key: 'edition', type: 'text', label: 'Издание / серия', half: true },
        { key: 'year', type: 'number', label: 'Год', half: true },
        { key: 'isbn', type: 'text', label: 'ISBN', scan: true },
    ],
    formatSubtitle: ({ subtitle, data }) => {
        const parts = [subtitle || data.author, data.year ? String(data.year) : undefined]
        return parts.filter(Boolean).join(' · ') || undefined
    },
    sortOptions: [
        { key: 'author', label: 'По автору' },
        { key: 'year', label: 'По году' },
    ],
    starterCategories: [
        'Проза', 'Нон-фикшн', 'Фантастика', 'История', 'Детское', 'Поэзия', 'Справочники', 'Комиксы',
    ],
}
