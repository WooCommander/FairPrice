
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
    storeId: string;
    author: string;
    unit: string;
}

class CatalogService {
    // Mock data for MVP
    // Mock data removed
    // private mockProducts: ProductDTO[] = []

    async searchProducts(query: string, _filters?: { category?: string, sort?: string }): Promise<ProductDTO[]> {
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
        // 1. Get recent price updates to identify active products
        const { data: recentPrices, error: priceError } = await supabase
            .from('prices')
            .select('product_id, created_at')
            .order('created_at', { ascending: false })
            .limit(20)

        if (priceError) {
            console.error('Error fetching recent prices:', priceError)
            return []
        }

        if (!recentPrices || recentPrices.length === 0) return []

        // 2. Extract unique product IDs
        const productIds = [...new Set(recentPrices.map(p => p.product_id))]

        // 3. Fetch full product details with ALL prices for these IDs
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
                *,
                prices (
                    price,
                    created_at,
                    store_id,
                    stores (name),
                    created_by,
                    unit
                )
            `)
            .in('id', productIds)

        if (productsError) {
            console.error('Error fetching products:', productsError)
            return []
        }

        // 4. Map to DTOs (this will calculate ranges correctly)
        // We preserve the order of the 'recentPrices' by sorting the result
        const productMap = new Map(products.map(p => [p.id, this.mapToDTO(p)]))

        return productIds
            .map(id => productMap.get(id))
            .filter((p): p is ProductDTO => !!p)
    }

    async getPopularSearchTerms(): Promise<string[]> {
        const { data } = await supabase
            .from('products')
            .select('category')
            .limit(50)

        if (!data) return []

        // Extract unique categories
        const categories = [...new Set(data.map((p: any) => p.category).filter(Boolean))]
        return categories.slice(0, 5)
    }

    async registerPriceUpdate(_productId: string, _price: number, _store: string, _unit: string) {
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
                unit: data.unit,
                created_by: (await supabase.auth.getUser()).data.user?.id
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
                date: price.created_at,
                storeName: price.stores?.name || 'Неизвестно',
                storeId: price.store_id,
                unit: price.unit || p.unit,
                author: 'User' // TODO: Join with profiles if available
            }))
        }
    }

    async updateProduct(id: string, updates: { name?: string, category?: string }) {
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)

        if (error) throw error
    }

    async deleteProduct(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    async updateStoreName(id: string, name: string) {
        const { error } = await supabase
            .from('stores')
            .update({ name })
            .eq('id', id)

        if (error) throw error
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
