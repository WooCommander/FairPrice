import type { ProductDTO } from '../services/CatalogService'

export interface ProductModel {
    id: string
    name: string
    category: string
    displayName: string
    formattedPrice: string
    lastUpdateRelative: string
    storeName?: string
    lastPrice?: number
    unit: string
    history: ProductHistoryModel[]
}

export interface ProductHistoryModel {
    price: number
    date: string
    storeName: string
    author: string
    unit: string
    dateRelative: string
}

export function adaptProduct(dto: ProductDTO): ProductModel {
    const price = dto.priceRange
        ? `${dto.priceRange.min.toLocaleString()} - ${dto.priceRange.max.toLocaleString()} ₽`
        : 'Нет цен'

    const specificPrice = dto.lastPrice
        ? `${dto.lastPrice.toLocaleString()} ₽`
        : price

    // Simple relative time
    const date = dto.lastUpdate ? new Date(dto.lastUpdate) : new Date()
    const diff = Date.now() - date.getTime()
    let timeString = 'только что'
    if (diff > 86400000) timeString = '1 дн. назад'
    else if (diff > 3600000) timeString = `${Math.floor(diff / 3600000)} ч. назад`
    else if (diff > 60000) timeString = `${Math.floor(diff / 60000)} мин. назад`

    return {
        id: dto.id,
        name: dto.name,
        category: dto.category,
        displayName: `${dto.name} (${dto.unit})`,
        formattedPrice: dto.lastPrice ? specificPrice : price,
        lastUpdateRelative: timeString,
        storeName: dto.lastStore || 'Неизвестно',
        lastPrice: dto.lastPrice,
        unit: dto.unit,
        history: (dto.history || []).map(h => ({
            price: h.price,
            date: h.date,
            storeName: h.storeName,
            author: h.author,
            unit: h.unit,
            dateRelative: new Date(h.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
        }))
    }
}
