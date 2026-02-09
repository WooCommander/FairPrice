
import { supabase } from '@/api/supabase'

export interface ProductDTO {
    id: string;
    name: string;
    category: string;
    unit: string;
    priceRange?: { min: number; max: number };
    lastUpdate?: string; // ISO string
    lastStore?: string; // New field for recent feed
    lastPrice?: number; // New field for recent feed
    history?: ProductHistoryDTO[];
}

export interface ProductHistoryDTO {
    price: number;
    date: string;
    storeName: string;
    author: string;
    unit: string;
}

class CatalogService {
    // Mock data for MVP
    // Mock data removed
    // private mockProducts: ProductDTO[] = []

    async searchProducts(query: string, filters?: { category?: string, sort?: string }): Promise<ProductDTO[]> {
        let queryBuilder = supabase
            .from('products')
            .select(`
                *,
                prices (
                    price,
                    created_at,
                    store_id,
                    stores (name)
                )
            `)
            .order('created_at', { ascending: false })

        if (query) {
            queryBuilder = queryBuilder.ilike('name', `%${query}%`)
        }

        const { data, error } = await queryBuilder

        if (error) {
            console.error('Error searching products:', error)
            return []
        }

        return data.map((p: any) => this.mapToDTO(p))
    }

    async getRecentProducts(): Promise<ProductDTO[]> {
        // Get recent PRICE updates
        const { data, error } = await supabase
            .from('prices')
            .select(`
                *,
                products (*),
                stores (name)
            `)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Error fetching recent products:', error)
            return []
        }

        // Map flat prices to ProductDTOs (deduplicating products if needed, 
        // but for "recent updates" feed, listing individual updates is fine 
        // OR we grouping by product. Current UI expects list of products.
        // Let's return the products associated with these prices.

        const productsMap = new Map<string, ProductDTO>()

        data.forEach((priceRow: any) => {
            if (!priceRow.products) return
            const p = priceRow.products

            // We want to show THIS specific price update as the "last" info
            const dto: ProductDTO = {
                id: p.id,
                name: p.name,
                category: p.category,
                unit: p.unit,
                lastPrice: priceRow.price,
                lastStore: priceRow.stores?.name,
                lastUpdate: priceRow.created_at
            }
            // Simple dedupe: if we already have this product in list, skip? 
            // Or show multiple updates for same product?
            // "Recent Updates" usually shows distinct events. 
            // But if I updated Potato price 5 times, showing 5 potatoes might be annoying.
            // Let's dedupe by ID for now.
            if (!productsMap.has(p.id)) {
                productsMap.set(p.id, dto)
            }
        })

        return Array.from(productsMap.values()).slice(0, 10)
    }

    async registerPriceUpdate(productId: string, price: number, store: string, unit: string) {
        // In DB mode, PriceService writes to DB. CatalogService just reads.
        // But if we need to trigger a refresh or something... 
        // actually PriceService calls this?
        // Wait, PriceService adds to 'prices' table.
        // CatalogService.registerPriceUpdate was for MOCK to update the product state.
        // In DB mode, we don't need to manually update cache here if we re-fetch.
        // But the store calls this. 
        // We can make this a no-op or force a refresh.
        // For now, no-op. The store `loadRecentUpdates` will re-fetch from DB.
    }

    async getProductById(id: string): Promise<ProductDTO | undefined> {
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                prices (
                    price,
                    created_at,
                    unit,
                    stores (name),
                    created_by
                )
            `)
            .eq('id', id)
            .single()

        if (error || !data) return undefined

        return this.mapToDTO(data)
    }

    async createProduct(data: { name: string, category: string, unit: string }): Promise<ProductDTO> {
        const { data: newProduct, error } = await supabase
            .from('products')
            .insert({
                name: data.name,
                category: data.category,
                unit: data.unit
            })
            .select()
            .single()

        if (error) throw error

        return {
            id: newProduct.id,
            name: newProduct.name,
            category: newProduct.category,
            unit: newProduct.unit,
            lastUpdate: newProduct.created_at
        }
    }

    private mapToDTO(p: any): ProductDTO {
        // Find latest price from the joined prices array if available
        let lastPriceObj = null
        if (p.prices && Array.isArray(p.prices) && p.prices.length > 0) {
            // Sort by created_at desc
            p.prices.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            lastPriceObj = p.prices[0]
        }

        return {
            id: p.id,
            name: p.name,
            category: p.category,
            unit: p.unit,
            lastPrice: lastPriceObj?.price,
            lastStore: lastPriceObj?.stores?.name,
            lastUpdate: lastPriceObj?.created_at || p.created_at, // Use price update time or product creation
            priceRange: this.calculatePriceRange(p.prices),
            history: p.prices?.map((price: any) => ({
                price: price.price,
                date: price.created_at,
                storeName: price.stores?.name || 'Неизвестно',
                unit: price.unit || p.unit,
                author: 'User' // TODO: Join with profiles if available
            }))
        }
    }

    private calculatePriceRange(prices: any[]) {
        if (!prices || prices.length === 0) return undefined
        const values = prices.map(p => p.price)
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        }
    }
}

export const instance = new CatalogService()
export { instance as CatalogService }
