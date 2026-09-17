import { ref, readonly, computed } from 'vue'
import { CollectionItemService } from '../services/CollectionItemService'
import type {
    CollectionItem,
    CollectionItemInsertDTO,
    CollectionItemUpdateDTO,
} from '../domain/CollectionItem'

const PAGE_SIZE = 24

// Holds items for whichever collection is currently open.
const activeCollectionId = ref<string | null>(null)
const items = ref<CollectionItem[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const error = ref<string | null>(null)

export const useCollectionItemsStore = () => {
    /** Loads the first page — cheap initial paint, more comes via `loadMore()`. */
    const load = async (collectionId: string, force = false) => {
        if (activeCollectionId.value === collectionId && !force && items.value.length) return

        activeCollectionId.value = collectionId
        isLoading.value = true
        error.value = null
        try {
            const page = await CollectionItemService.fetchItems(collectionId, { offset: 0, limit: PAGE_SIZE })
            items.value = page
            hasMore.value = page.length === PAGE_SIZE
        } catch (err: any) {
            console.error('Failed to fetch items:', err)
            error.value = err.message || 'Ошибка загрузки'
            items.value = []
            hasMore.value = false
        } finally {
            isLoading.value = false
        }
    }

    /** Fetches the next batch and appends it (infinite scroll). No-op once `hasMore` is false. */
    const loadMore = async () => {
        if (!hasMore.value || isLoadingMore.value || !activeCollectionId.value) return
        isLoadingMore.value = true
        try {
            const page = await CollectionItemService.fetchItems(activeCollectionId.value, {
                offset: items.value.length,
                limit: PAGE_SIZE,
            })
            items.value = [...items.value, ...page]
            hasMore.value = page.length === PAGE_SIZE
        } catch (err: any) {
            console.error('Failed to fetch more items:', err)
        } finally {
            isLoadingMore.value = false
        }
    }

    /** Fetches every item in one go (e.g. search needs the whole collection, not just page 1). */
    const loadFull = async (collectionId: string) => {
        activeCollectionId.value = collectionId
        isLoading.value = true
        error.value = null
        try {
            items.value = await CollectionItemService.fetchItems(collectionId)
            hasMore.value = false
        } catch (err: any) {
            console.error('Failed to fetch items:', err)
            error.value = err.message || 'Ошибка загрузки'
            items.value = []
        } finally {
            isLoading.value = false
        }
    }

    const addItem = async (dto: CollectionItemInsertDTO) => {
        const created = await CollectionItemService.createItem(dto)
        if (created.collection_id === activeCollectionId.value) items.value.unshift(created)
        return created
    }

    const editItem = async (id: string, updates: CollectionItemUpdateDTO) => {
        const updated = await CollectionItemService.updateItem(id, updates)
        const idx = items.value.findIndex(i => i.id === id)
        if (idx !== -1) items.value[idx] = updated
        return updated
    }

    const removeItem = async (id: string) => {
        await CollectionItemService.deleteItem(id)
        items.value = items.value.filter(i => i.id !== id)
    }

    return {
        activeCollectionId: readonly(activeCollectionId),
        // computed (not readonly()) keeps element types mutable for component props
        items: computed(() => items.value),
        isLoading: readonly(isLoading),
        isLoadingMore: readonly(isLoadingMore),
        hasMore: readonly(hasMore),
        error: readonly(error),
        load,
        loadMore,
        loadFull,
        addItem,
        editItem,
        removeItem,
    }
}
