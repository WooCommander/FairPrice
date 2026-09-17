import type { CollectionTypeConfig } from '../domain/types'
import { booksType } from './books'
import { medsType } from './meds'

// Registry of every collection type the app knows how to render.
// Add a new entry here to support a new kind of catalog.
export const COLLECTION_TYPES: CollectionTypeConfig[] = [
    booksType as CollectionTypeConfig,
    medsType as CollectionTypeConfig,
]

const BY_KEY = new Map(COLLECTION_TYPES.map(t => [t.key, t]))

/** Fallback used when a collection references an unknown/removed type. */
export const FALLBACK_TYPE: CollectionTypeConfig = {
    key: 'generic',
    label: 'Элементы',
    itemLabel: 'Элемент',
    icon: 'Package',
    defaultCollectionName: 'Новая коллекция',
    titleHint: 'Название',
    subtitleHint: 'Описание',
    listLayout: 'list',
    fields: [],
}

export const getCollectionType = (key: string | null | undefined): CollectionTypeConfig =>
    (key && BY_KEY.get(key)) || FALLBACK_TYPE

export { booksType, medsType }
export type { BookData } from './books'
export type { MedData } from './meds'
