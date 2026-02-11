import { ref, computed } from 'vue'
import { shoppingListService, type ShoppingListItem } from '../services/ShoppingListService'

const items = ref<ShoppingListItem[]>([])
const isLoading = ref(false)

export const shoppingListStore = {
    items,
    isLoading,

    async loadItems() {
        isLoading.value = true
        try {
            items.value = await shoppingListService.getItems()
        } catch (e) {
            console.error('Failed to load shopping list', e)
        } finally {
            isLoading.value = false
        }
    },

    async addItem(text: string, productId?: string) {
        try {
            const newItem = await shoppingListService.addItem(text, productId)
            if (newItem) {
                items.value.push(newItem)
            }
        } catch (e) {
            console.error('Failed to add item', e)
            throw e
        }
    },

    async toggleItem(id: string, isChecked: boolean) {
        // Optimistic update
        const item = items.value.find(i => i.id === id)
        if (item) {
            item.is_checked = isChecked
        }

        try {
            await shoppingListService.toggleItem(id, isChecked)
        } catch (e) {
            // Revert on failure
            if (item) item.is_checked = !isChecked
            console.error('Failed to toggle item', e)
        }
    },

    async removeItem(id: string) {
        // Optimistic update
        const index = items.value.findIndex(i => i.id === id)
        if (index === -1) return

        const removed = items.value[index]
        items.value.splice(index, 1)

        try {
            await shoppingListService.removeItem(id)
        } catch (e) {
            // Revert
            items.value.splice(index, 0, removed)
            console.error('Failed to remove item', e)
        }
    },

    async deleteChecked() {
        const original = [...items.value]
        items.value = items.value.filter(i => !i.is_checked)

        try {
            await shoppingListService.deleteChecked()
        } catch (e) {
            items.value = original
            console.error('Failed to clear checked items', e)
        }
    },

    checkedItems: computed(() => items.value.filter(i => i.is_checked)),
    uncheckedItems: computed(() => items.value.filter(i => !i.is_checked))
}
