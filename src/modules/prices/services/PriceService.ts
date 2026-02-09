import { supabase } from '@/api/supabase'

export interface AddPriceDTO {
    productId: string
    storeName: string // MVP: Just name for now
    price: number
    currency: 'UZS' | 'RUB'
    unit: string
}

class PriceService {
    async addPrice(dto: AddPriceDTO): Promise<void> {
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
                .insert({ name: dto.storeName })
                .select('id')
                .single()

            if (storeError) {
                console.error('Error creating store:', storeError)
                throw storeError
            }
            storeId = newStore.id
        }

        // 2. Insert Price
        const { error: priceError } = await supabase
            .from('prices')
            .insert({
                product_id: dto.productId,
                store_id: storeId,
                price: dto.price,
                currency: dto.currency,
                unit: dto.unit
            })

        if (priceError) {
            console.error('Error adding price:', priceError)
            throw priceError
        }
    }

    async getStores(query: string = ''): Promise<{ id: string, name: string }[]> {
        let queryBuilder = supabase
            .from('stores')
            .select('id, name')
            .order('name')

        if (query) {
            queryBuilder = queryBuilder.ilike('name', `%${query}%`)
        }

        const { data, error } = await queryBuilder

        if (error) {
            console.error('Error fetching stores:', error)
            return []
        }

        return data || []
    }
}

export const instance = new PriceService()
export { instance as PriceService }
