import type { ProductDTO } from '../services/CatalogService'

export interface ProductModel {
    id: string
    name: string
    category: string
    displayName: string
    formattedPrice: string
    lastUpdateRelative: string
}

export function adaptProduct(dto: ProductDTO): ProductModel {
    const price = dto.priceRange
        ? `${dto.priceRange.min.toLocaleString()} - ${dto.priceRange.max.toLocaleString()} UZS`
        : 'Нет цен'

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
        formattedPrice: price,
        lastUpdateRelative: timeString
    }
}
