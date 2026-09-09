import { ref, readonly, computed } from 'vue'
import { authStore } from '@/modules/auth/store/authStore'
import { CollectionService } from '../services/CollectionService'
import { CategoryService } from '../services/CategoryService'
import { getCollectionType } from '../config'
import type { Collection, CollectionInsertDTO, CollectionUpdateDTO } from '../domain/Collection'

const collections = ref<Collection[]>([])
const isLoading = ref(false)
const isLoaded = ref(false)
const error = ref<string | null>(null)

export const useCollectionsStore = () => {
    const fetchCollections = async (force = false) => {
        if (!authStore.user.value) {
            collections.value = []
            isLoaded.value = false
            return
        }
        if (isLoaded.value && !force) return

        isLoading.value = true
        error.value = null
        try {
            await CollectionService.linkShares()
            collections.value = await CollectionService.fetchCollections()
            isLoaded.value = true
        } catch (err: any) {
            console.error('Failed to fetch collections:', err)
            error.value = err.message || 'Ошибка загрузки каталогов'
        } finally {
            isLoading.value = false
        }
    }

    const addCollection = async (dto: CollectionInsertDTO) => {
        const created = await CollectionService.createCollection(dto)
        const starters = getCollectionType(dto.type).starterCategories ?? []
        if (starters.length) {
            try {
                await CategoryService.seedCategories(created.id, starters)
            } catch (e) {
                console.warn('seedCategories failed', e)
            }
        }
        collections.value.push(created)
        return created
    }

    const editCollection = async (id: string, updates: CollectionUpdateDTO) => {
        const updated = await CollectionService.updateCollection(id, updates)
        const idx = collections.value.findIndex(c => c.id === id)
        if (idx !== -1) collections.value[idx] = { ...collections.value[idx], ...updated }
        return updated
    }

    const removeCollection = async (id: string) => {
        await CollectionService.deleteCollection(id)
        collections.value = collections.value.filter(c => c.id !== id)
    }

    const getById = (id: string) => collections.value.find(c => c.id === id) ?? null

    const ownCollections = computed(() => collections.value.filter(c => c.is_owner))
    const sharedCollections = computed(() => collections.value.filter(c => !c.is_owner))

    return {
        collections: readonly(collections),
        ownCollections,
        sharedCollections,
        isLoading: readonly(isLoading),
        isLoaded: readonly(isLoaded),
        error: readonly(error),
        fetchCollections,
        addCollection,
        editCollection,
        removeCollection,
        getById,
    }
}
