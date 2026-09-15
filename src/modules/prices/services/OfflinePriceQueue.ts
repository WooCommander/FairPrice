import type { AddPriceDTO } from './PriceService'

export interface PendingPrice {
    id: string
    userId: string
    dto: AddPriceDTO
    createdAt: string
    attempts: number
    lastError?: string
}

const STORAGE_KEY = 'fp_offline_price_queue_v1'

function load(): PendingPrice[] {
    try {
        const value = localStorage.getItem(STORAGE_KEY)
        if (!value) return []

        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
    } catch (error) {
        console.warn('Failed to read offline price queue', error)
        return []
    }
}

function save(items: PendingPrice[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
        console.warn('Failed to save offline price queue', error)
        throw new Error('Не удалось сохранить цену на устройстве')
    }
}

function createId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const OfflinePriceQueue = {
    getAll(): PendingPrice[] {
        return load()
    },

    add(userId: string, dto: AddPriceDTO): PendingPrice[] {
        const items = load()
        items.push({
            id: createId(),
            userId,
            dto: { ...dto },
            createdAt: new Date().toISOString(),
            attempts: 0
        })
        save(items)
        return items
    },

    remove(id: string): PendingPrice[] {
        const items = load().filter(item => item.id !== id)
        save(items)
        return items
    },

    markFailed(id: string, error: unknown): PendingPrice[] {
        const message = error instanceof Error ? error.message : String(error)
        const items = load().map(item => item.id === id
            ? { ...item, attempts: item.attempts + 1, lastError: message }
            : item)
        save(items)
        return items
    }
}
