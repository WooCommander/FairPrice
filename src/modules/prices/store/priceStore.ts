import { computed, readonly, ref } from 'vue'
import { PriceService, type AddPriceDTO } from '../services/PriceService'
import { OfflinePriceQueue, type PendingPrice } from '../services/OfflinePriceQueue'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { authStore } from '@/modules/auth/store/authStore'

const isSubmitting = ref(false)
const isSyncing = ref(false)
const error = ref<string | null>(null)
const pendingPrices = ref<PendingPrice[]>(OfflinePriceQueue.getAll())
let syncInitialized = false

export type SubmitPriceResult = 'synced' | 'queued'

function isNetworkError(cause: unknown): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return true

    const message = cause instanceof Error ? cause.message : String(cause)
    return /failed to fetch|network|load failed|timeout|connection|fetch/i.test(message)
}

function queuePrice(dto: AddPriceDTO): SubmitPriceResult {
    const userId = authStore.currentUserId.value
    if (!userId) throw new Error('Требуется авторизация')

    pendingPrices.value = OfflinePriceQueue.add(userId, dto)
    return 'queued'
}

export const priceStore = {
    isSubmitting: readonly(isSubmitting),
    isSyncing: readonly(isSyncing),
    error: readonly(error),
    pendingCount: computed(() => {
        const userId = authStore.currentUserId.value
        return userId ? pendingPrices.value.filter(item => item.userId === userId).length : 0
    }),

    async submitPrice(dto: AddPriceDTO): Promise<SubmitPriceResult> {
        isSubmitting.value = true
        error.value = null
        try {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                return queuePrice(dto)
            }

            const userId = authStore.currentUserId.value
            if (!userId) throw new Error('Требуется авторизация')

            await PriceService.addPrice(dto, { createdBy: userId })
            await catalogStore.registerPriceUpdate(dto.productId, dto.price, dto.storeName, dto.quantityUnit)
            return 'synced'
        } catch (cause: unknown) {
            if (isNetworkError(cause)) {
                return queuePrice(dto)
            }

            const message = cause instanceof Error ? cause.message : String(cause)
            error.value = message || 'Ошибка при добавлении цены'
            throw cause
        } finally {
            isSubmitting.value = false
        }
    },

    async syncPendingPrices(): Promise<number> {
        const userId = authStore.currentUserId.value
        if (!userId || isSyncing.value || (typeof navigator !== 'undefined' && !navigator.onLine)) return 0

        isSyncing.value = true
        let syncedCount = 0
        const updatedProducts = new Set<string>()

        try {
            const items = pendingPrices.value.filter(item => item.userId === userId)
            for (const item of items) {
                try {
                    await PriceService.addPrice(item.dto, {
                        createdBy: userId,
                        recordedAt: item.createdAt
                    })
                    pendingPrices.value = OfflinePriceQueue.remove(item.id)
                    updatedProducts.add(item.dto.productId)
                    syncedCount++
                } catch (syncError) {
                    pendingPrices.value = OfflinePriceQueue.markFailed(item.id, syncError)
                    if (isNetworkError(syncError)) break
                }
            }

            for (const productId of updatedProducts) {
                await catalogStore.registerPriceUpdate(productId, 0, '', '')
            }

            return syncedCount
        } finally {
            isSyncing.value = false
        }
    },

    initOfflineSync() {
        if (syncInitialized || typeof window === 'undefined') return
        syncInitialized = true
        window.addEventListener('online', () => {
            priceStore.syncPendingPrices().catch(console.error)
        })
        priceStore.syncPendingPrices().catch(console.error)
    },

    async getStores(query: string) {
        return PriceService.getStores(query)
    },

    reset() {
        error.value = null
        isSubmitting.value = false
    }
}
