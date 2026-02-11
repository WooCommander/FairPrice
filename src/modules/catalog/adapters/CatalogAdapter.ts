import type { ProductDTO } from '../services/CatalogService'

export interface ProductModel {
    id: string
    name: string
    unit: string;
    description?: string;
    lastUpdate?: Date;
    lastUpdateRelative?: string;
    lastStore?: string;
    lastStoreId?: string;
    lastPrice?: number;
    priceRange?: { min: number; max: number };
    created_by?: string;
    formattedPriceRange?: string;
    history: ProductHistoryModel[]
    category: string;
    formattedPrice: string; // Add missing properties
    formattedAveragePrice?: string; // New field
    displayName: string;
}

export interface ProductHistoryModel {
    id?: string
    price: number
    date: string
    storeName: string
    storeId: string
    author: string
    unit: string
    dateRelative: string
}

export function adaptProduct(dto: ProductDTO): ProductModel {
    // Simple relative time

    return {
        id: dto.id,
        name: dto.name,
        category: dto.category,
        displayName: `${dto.name} (${dto.unit})`,
        unit: dto.unit,
        created_by: dto.created_by,
        lastUpdate: dto.lastUpdate ? new Date(dto.lastUpdate) : undefined,
        lastUpdateRelative: dto.lastUpdate ? formatTimeAgo(new Date(dto.lastUpdate)) : '',
        lastStore: dto.lastStore,
        lastStoreId: dto.lastStoreId,
        lastPrice: dto.lastPrice,
        priceRange: dto.priceRange,
        formattedPriceRange: formatPriceRange(dto.priceRange),
        formattedPrice: dto.lastPrice ? formatPrice(dto.lastPrice) : 'Нет цены',
        formattedAveragePrice: dto.averagePrice ? `~${formatPrice(dto.averagePrice)}` : undefined,
        history: (dto.history || []).map(h => ({
            id: h.id,
            price: h.price,
            date: h.date,
            storeName: h.storeName,
            storeId: h.storeId,
            author: h.author,
            unit: h.unit,
            dateRelative: new Date(h.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
        }))
    }
}

function formatTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime()
    if (diff < 60000) return 'только что'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`
    return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Нет цен'
    return `${price.toLocaleString()} ₽`
}

function formatPriceRange(range?: { min: number; max: number }): string {
    if (!range) return 'Нет цен'
    if (range.min !== range.max) {
        return `${range.min.toLocaleString()} - ${range.max.toLocaleString()} ₽`
    }
    return `${range.min.toLocaleString()} ₽`
}
