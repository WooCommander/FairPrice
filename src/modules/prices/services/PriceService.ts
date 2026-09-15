import { supabase } from '@/api/supabase'
import { getCache, setCache } from '@/shared/lib/cache'

export interface AddPriceDTO {
    productId: string
    storeName: string
    price: number
    currency: 'UZS' | 'RUB'
    quantity: number      // New: Amount (e.g. 900)
    quantityUnit: string  // New: Unit (e.g. 'ml')
}

interface AddPriceOptions {
    createdBy?: string
    recordedAt?: string
}

class PriceService {
    async addPrice(dto: AddPriceDTO, options: AddPriceOptions = {}): Promise<void> {
        const userId = options.createdBy || (await supabase.auth.getUser()).data.user?.id
        if (!userId) throw new Error('Требуется авторизация')

        // 1. Find or Create Store
        let storeId: string | undefined

        // Try to find existing
        const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .ilike('name', dto.storeName)
            .single()

        if (existingStore) {
            storeId = existingStore.id
        } else {
            // Create new
            const { data: newStore, error: storeError } = await supabase
                .from('stores')
                .insert({
                    name: dto.storeName,
                    created_by: userId
                })
                .select('id')
                .single()

            if (storeError) {
                console.error('Error creating store:', storeError)
                throw storeError
            }
            storeId = newStore.id
        }

        // 2. Normalize Price (Calculate price per 1 base unit)
        // Base units: kg, l, pcs
        let normalizedPrice: number | null = null
        const q = Number(dto.quantity)
        const u = dto.quantityUnit.toLowerCase()

        if (q > 0) {
            if (u === 'g' || u === 'г') {
                // Convert g to kg
                normalizedPrice = dto.price / (q / 1000)
            } else if (u === 'ml' || u === 'мл') {
                // Convert ml to l
                normalizedPrice = dto.price / (q / 1000)
            } else if (u === 'kg' || u === 'кг') {
                normalizedPrice = dto.price / q
            } else if (u === 'l' || u === 'л') {
                normalizedPrice = dto.price / q
            } else {
                // pcs or unknown, just price / quantity
                normalizedPrice = dto.price / q
            }
        }

        // 3. Insert Price
        const priceRecord: Record<string, unknown> = {
            product_id: dto.productId,
            store_id: storeId,
            price: dto.price,
            currency: dto.currency,
            quantity: dto.quantity,
            quantity_unit: dto.quantityUnit,
            normalized_price: normalizedPrice ? Math.round(normalizedPrice) : null,
            created_by: userId
        }

        if (options.recordedAt) {
            priceRecord.created_at = options.recordedAt
        }

        const { error: priceError } = await supabase
            .from('prices')
            .insert(priceRecord)

        if (priceError) {
            console.error('Error adding price:', priceError)
            throw priceError
        }
    }

    async getStores(query: string = '', limit: number = 50): Promise<{ id: string, name: string }[]> {
        const cachedStores = getCache<{ id: string, name: string }[]>('stores') || []
        let queryBuilder = supabase
            .from('stores')
            .select('id, name')
            .order('name')
            .limit(limit)

        if (query) {
            queryBuilder = queryBuilder.ilike('name', `%${query}%`)
        }

        const { data, error } = await queryBuilder

        if (error) {
            console.error('Error fetching stores:', error)
            const normalizedQuery = query.trim().toLocaleLowerCase()
            return cachedStores
                .filter(store => !normalizedQuery || store.name.toLocaleLowerCase().includes(normalizedQuery))
                .slice(0, limit)
        }

        const stores = data || []
        if (!query) setCache('stores', stores)
        return stores
    }
}

export const instance = new PriceService()
export { instance as PriceService }
