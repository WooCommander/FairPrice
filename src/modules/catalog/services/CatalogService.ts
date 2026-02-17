
import { supabase } from '@/api/supabase'

export interface ProductDTO {
    id: string;
    name: string;
    category: string;
    unit: string;
    priceRange?: { min: number; max: number };
    lastUpdate?: string; // ISO string
    lastStore?: string; // New field for recent feed
    lastStoreId?: string; // ID for navigation
    lastPrice?: number; // New field for recent feed
    normalizedPrice?: number; // New field for fair price comparison
    quantity?: number;
    quantityUnit?: string;
    averagePrice?: number; // New field: Average price for current month
    created_by?: string; // Owner ID
    history?: ProductHistoryDTO[];
}

export interface ProductHistoryDTO {
    id?: string; // Add ID for deletion
    price: number;
    date: string;
    storeName: string;
    storeId: string;
    author: string;
    unit: string;
    createdBy?: string; // Add createdBy
}

class CatalogService {
    // Mock data for MVP
    // Mock data removed
    // private mockProducts: ProductDTO[] = []

    async searchProducts(query: string, filters?: { category?: string, sort?: string }, page: number = 1, limit: number = 20): Promise<{ items: ProductDTO[], total: number }> {
        // Calculate range
        const from = (page - 1) * limit
        const to = from + limit - 1

        let queryBuilder = supabase
            .from('products')
            .select(`
                *,
                prices (
                    price,
                    created_at,
                    store_id,
                    stores (name),
                    quantity,
                    quantity_unit,
                    normalized_price
                )
            `, { count: 'estimated' })
            .order('created_at', { ascending: false })

        if (query) {
            queryBuilder = queryBuilder.ilike('name', `%${query}%`)
        }

        if (filters?.category) {
            queryBuilder = queryBuilder.eq('category', filters.category)
        }

        // Sorting logic (if needed) - currently default is created_at desc
        if (filters?.sort) {
            // TODO: Add dynamic sorting if requested
            if (filters.sort === 'price_asc') {
                // Sorting by price is tricky because price is in a joined table or computed.
                // For MVP/Supabase, we might need a derived column or client-side sort (bad for large data).
                // Alternatively, use an RPC or specific index. 
                // For now, keep default sort or improve later.
            }
        }

        const { data, error, count } = await queryBuilder
            .range(from, to)

        if (error) {
            console.error('Error searching products:', error)
            return { items: [], total: 0 }
        }

        return {
            items: data.map((p: any) => this.mapToDTO(p)),
            total: count || 0
        }
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
                    unit,
                    quantity,
                    quantity_unit,
                    normalized_price
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

    async getStoreDetails(id: string): Promise<{ id: string, name: string } | undefined> {
        const { data, error } = await supabase
            .from('stores')
            .select('id, name')
            .eq('id', id)
            .single()

        if (error || !data) return undefined
        return data
    }

    async getProductsByStore(storeId: string): Promise<ProductDTO[]> {
        // Get all prices for this store
        const { data: prices, error } = await supabase
            .from('prices')
            .select('product_id')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false })

        if (error || !prices) return []

        const productIds = [...new Set(prices.map(p => p.product_id))]

        if (productIds.length === 0) return []

        // Fetch products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
                *,
                prices (
                    price,
                    created_at,
                    unit,
                    store_id,
                    store_id,
                    stores (name),
                    created_by,
                    quantity,
                    quantity_unit,
                    normalized_price
                )
            `)
            .in('id', productIds)

        if (productsError || !products) return []

        return products.map(p => this.mapToDTO(p))
    }

    async getProductsByCategory(category: string): Promise<ProductDTO[]> {
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                *,
                prices (
                    price,
                    created_at,
                    unit,
                    store_id,
                    store_id,
                    stores (name),
                    created_by,
                    quantity,
                    quantity_unit,
                    normalized_price
                )
            `)
            .eq('category', category)
            .order('name')

        if (error || !products) return []

        return products.map(p => this.mapToDTO(p))
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
                    store_id,
                    store_id,
                    stores (name),
                    created_by,
                    quantity,
                    quantity_unit,
                    normalized_price
                )
            `)
            .eq('id', id)
            .single()

        if (error || !data) return undefined

        return this.mapToDTO(data)
    }

    async createProduct(data: { name: string, category: string, unit: string }): Promise<ProductDTO> {
        // Check for duplicates (case-insensitive)
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .ilike('name', data.name)
            .single()

        if (existing) {
            throw new Error('Товар с таким названием уже существует')
        }

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
            created_by: p.created_by,
            lastPrice: lastPriceObj?.price,
            normalizedPrice: lastPriceObj?.normalized_price, // Map normalized price
            quantity: lastPriceObj?.quantity,
            quantityUnit: lastPriceObj?.quantity_unit,
            lastStore: lastPriceObj?.stores?.name,
            lastStoreId: lastPriceObj?.store_id, // Added field
            lastUpdate: lastPriceObj?.created_at || p.created_at, // Use price update time or product creation
            priceRange: this.calculatePriceRange(p.prices),
            averagePrice: this.calculateAveragePrice(p.prices), // Calculate average
            history: p.prices?.map((price: any) => ({
                id: price.id,
                price: price.price,
                date: price.created_at,
                storeName: price.stores?.name || 'Неизвестно',
                storeId: price.store_id,
                unit: price.unit || p.unit,
                author: 'User', // TODO: Join with profiles if available
                createdBy: price.created_by // Map created_by
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

    async deletePrice(id: string) {
        const { error } = await supabase
            .from('prices')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    async deleteProduct(id: string) {
        console.log(`Attempting to delete product ${id}`)

        // 1. Delete prices
        const { data: deletedPrices, error: pricesError } = await supabase
            .from('prices')
            .delete()
            .eq('product_id', id)
            .select()

        if (pricesError) {
            console.error('Error deleting product prices:', pricesError)
            throw new Error(`Ошибка при удалении цен: ${pricesError.message}`)
        }
        console.log(`Deleted ${deletedPrices?.length || 0} prices`)

        // 2. Delete product
        const { data: deletedProduct, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select()

        if (error) {
            console.error('Error deleting product:', error)
            throw new Error(`Ошибка при удалении товара: ${error.message}`)
        }

        if (!deletedProduct || deletedProduct.length === 0) {
            console.warn('Delete operation returned 0 rows. RLS might be blocking it.')
            throw new Error('Не удалось удалить товар. Возможно, у вас нет прав (RLS) или товар уже удален.')
        }

        console.log('Product deleted successfully')
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

    private calculateAveragePrice(prices: any[]): number | undefined {
        if (!prices || prices.length === 0) return undefined

        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        // Filter prices for the current month
        const currentMonthPrices = prices.filter(p => {
            const date = new Date(p.created_at)
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear
        })

        if (currentMonthPrices.length === 0) return undefined

        // Prefer normalized_price if available, otherwise fallback to price
        const sum = currentMonthPrices.reduce((acc, p) => {
            const val = p.normalized_price || p.price
            return acc + val
        }, 0)

        return sum / currentMonthPrices.length
    }

    async getFavorites(): Promise<string[]> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data, error } = await supabase
            .from('favorites')
            .select('product_id')
            .eq('user_id', user.id)

        if (error || !data) return []
        return data.map((f: any) => f.product_id)
    }

    async toggleFavorite(productId: string): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not logged in')

        // Check if exists
        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single()

        if (existing) {
            // Delete
            await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId)
            return false // Not favorite anymore
        } else {
            // Insert
            await supabase
                .from('favorites')
                .insert({
                    user_id: user.id,
                    product_id: productId
                })
            return true // Is favorite now
        }
    }
}

export const instance = new CatalogService()
export { instance as CatalogService }
