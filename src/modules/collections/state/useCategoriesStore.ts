import { ref, readonly } from 'vue'
import { CategoryService } from '../services/CategoryService'
import { CATEGORY_COLORS } from '../domain/Category'
import type { CollectionCategory, CategoryUpdateDTO } from '../domain/Category'

const activeCollectionId = ref<string | null>(null)
const categories = ref<CollectionCategory[]>([])
const isLoading = ref(false)

export const useCategoriesStore = () => {
    const load = async (collectionId: string, force = false) => {
        if (activeCollectionId.value === collectionId && !force && categories.value.length) return

        activeCollectionId.value = collectionId
        isLoading.value = true
        try {
            categories.value = await CategoryService.fetchCategories(collectionId)
        } catch (err) {
            console.error('Failed to fetch categories:', err)
            categories.value = []
        } finally {
            isLoading.value = false
        }
    }

    const addCategory = async (collectionId: string, name: string) => {
        const created = await CategoryService.createCategory({
            collection_id: collectionId,
            name,
            color: CATEGORY_COLORS[categories.value.length % CATEGORY_COLORS.length],
            sort: categories.value.length,
        })
        categories.value.push(created)
        return created
    }

    const editCategory = async (id: string, updates: CategoryUpdateDTO) => {
        const updated = await CategoryService.updateCategory(id, updates)
        const idx = categories.value.findIndex(c => c.id === id)
        if (idx !== -1) categories.value[idx] = updated
        return updated
    }

    const removeCategory = async (id: string) => {
        await CategoryService.deleteCategory(id)
        categories.value = categories.value.filter(c => c.id !== id)
    }

    const getById = (id: string | null) =>
        id ? categories.value.find(c => c.id === id) ?? null : null

    return {
        categories: readonly(categories),
        isLoading: readonly(isLoading),
        load,
        addCategory,
        editCategory,
        removeCategory,
        getById,
    }
}
