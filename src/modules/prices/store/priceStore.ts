import { ref, readonly } from 'vue'
import { PriceService, type AddPriceDTO } from '../services/PriceService'

const isSubmitting = ref(false)
const error = ref<string | null>(null)

export const priceStore = {
    isSubmitting: readonly(isSubmitting),
    error: readonly(error),

    async submitPrice(dto: AddPriceDTO) {
        isSubmitting.value = true
        error.value = null
        try {
            await PriceService.addPrice(dto)
        } catch (e: any) {
            error.value = e.message || 'Ошибка при добавлении цены'
            throw e
        } finally {
            isSubmitting.value = false
        }
    },

    async getStores(query: string) {
        return PriceService.getStores(query)
    },

    reset() {
        error.value = null
        isSubmitting.value = false
    }
}
