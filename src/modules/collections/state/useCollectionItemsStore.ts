import { ref, readonly, computed } from 'vue'
import { CollectionItemService } from '../services/CollectionItemService'
import type {
    CollectionItem,
    CollectionItemInsertDTO,
    CollectionItemUpdateDTO,
} from '../domain/CollectionItem'

// Holds items for whichever collection is currently open.
const activeCollectionId = ref<string | null>(null)
const items = ref<CollectionItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export const useCollectionItemsStore = () => {
    const load = async (collectionId: string, force = false) => {
        if (activeCollectionId.value === collectionId && !force && items.value.length) return

        activeCollectionId.value = collectionId
        isLoading.value = true
        error.value = null
        try {
            items.value = await CollectionItemService.fetchItems(collectionId)
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
        error: readonly(error),
        load,
        addItem,
        editItem,
        removeItem,
    }
}
