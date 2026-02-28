import { ref, computed, readonly } from 'vue'
import { shoppingListService } from '../services/ShoppingListService'
import { type ShoppingListModel, shoppingListDtoToModel } from '../shoppingListAdapter'

const items = ref<ShoppingListModel[]>([])
const isLoading = ref(false)

export const shoppingListStore = {
    items: readonly(items),
    isLoading: readonly(isLoading),

    async loadItems() {
        isLoading.value = true
        try {
            const dtos = await shoppingListService.getItems()
            items.value = dtos.map(shoppingListDtoToModel)
        } catch (e) {
            console.error('Failed to load shopping list', e)
        } finally {
            isLoading.value = false
        }
    },

    async addItem(text: string, productId?: string, details?: { price?: number, quantity?: number, unit?: string }) {
        try {
            const newItemDto = await shoppingListService.addItem(text, productId, details)
            if (newItemDto) {
                items.value.push(shoppingListDtoToModel(newItemDto))
            }
        } catch (e) {
            console.error('Failed to add item', e)
            throw e
        }
    },

    async toggleItem(id: string, isChecked: boolean, details?: { price?: number, quantity?: number, unit?: string }) {
        // Optimistic update
        const item = items.value.find(i => i.id === id)
        if (item) {
            const oldChecked = item.isChecked
            item.isChecked = isChecked
            if (details) {
                Object.assign(item, details)
            }

            try {
                await shoppingListService.toggleItem(id, isChecked, details)
            } catch (e) {
                // Revert on failure
                item.isChecked = oldChecked
                console.error('Failed to toggle item', e)
            }
        }
    },

    async updateItem(id: string, updates: Partial<ShoppingListModel>) {
        const item = items.value.find(i => i.id === id)
        if (item) {
            const original = { ...item }
            Object.assign(item, updates)

            try {
                await shoppingListService.updateItem(id, updates as any)
            } catch (e) {
                Object.assign(item, original)
                console.error('Failed to update item', e)
            }
        }
    },

    async removeItem(id: string) {
        const index = items.value.findIndex(i => i.id === id)
        if (index === -1) return

        const removed = items.value[index]
        items.value.splice(index, 1)

        try {
            await shoppingListService.removeItem(id)
        } catch (e) {
            items.value.splice(index, 0, removed)
            console.error('Failed to remove item', e)
        }
    },

    async deleteChecked() {
        const original = [...items.value]
        items.value = items.value.filter(i => !i.isChecked)

        try {
            await shoppingListService.deleteChecked()
        } catch (e) {
            items.value = original
            console.error('Failed to clear checked items', e)
        }
    },

    checkedItems: computed(() => items.value.filter(i => i.isChecked)),
    uncheckedItems: computed(() => items.value.filter(i => !i.isChecked)),

    totalExpenses: computed(() => {
        return items.value
            .filter(i => i.isChecked && i.price)
            .reduce((sum, i) => sum + (Number(i.price) * (Number(i.quantity) || 1)), 0)
    }),

    estimatedTotal: computed(() => {
        return items.value
            .filter(i => !i.isChecked)
            .reduce((sum, i) => {
                const p = i.estimatedPrice || 0
                const q = i.quantity || 1
                return sum + (p * q)
            }, 0)
    })
}
