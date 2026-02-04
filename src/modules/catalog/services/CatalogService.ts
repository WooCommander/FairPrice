
interface ProductDTO {
    id: string;
    name: string;
    category: string;
    unit: string;
    priceRange?: { min: number; max: number };
    lastUpdate?: string; // ISO string
}

class CatalogService {
    // Mock data for MVP
    private mockProducts: ProductDTO[] = [
        {
            id: '1', name: 'Картофель', category: 'Овощи', unit: 'кг',
            priceRange: { min: 4500, max: 8000 }, lastUpdate: new Date().toISOString()
        },
        {
            id: '2', name: 'Лук репчатый', category: 'Овощи', unit: 'кг',
            priceRange: { min: 3000, max: 5000 }, lastUpdate: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: '3', name: 'Морковь', category: 'Овощи', unit: 'кг',
            priceRange: { min: 4000, max: 6000 }, lastUpdate: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: '4', name: 'Говядина (мякоть)', category: 'Мясо', unit: 'кг',
            priceRange: { min: 85000, max: 110000 }, lastUpdate: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: '5', name: 'Яйца (10 шт)', category: 'Бакалея', unit: 'уп',
            priceRange: { min: 14000, max: 19000 }, lastUpdate: new Date(Date.now() - 1800000).toISOString()
        },
        {
            id: '6', name: 'Масло подсолнечное', category: 'Бакалея', unit: 'л',
            priceRange: { min: 14000, max: 18000 }, lastUpdate: new Date(Date.now() - 43200000).toISOString()
        },
    ]

    async searchProducts(query: string, filters?: { category?: string, sort?: string }): Promise<ProductDTO[]> {
        // Simulate API delay
        await new Promise(r => setTimeout(r, 500))

        // DEBUG: Always return all if no query/filters, ensure mockProducts exists
        let results = [...this.mockProducts]

        if (query) {
            const lowerQuery = query.toLowerCase()
            results = results.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.category.toLowerCase().includes(lowerQuery)
            )
        }

        if (filters?.category) {
            results = results.filter(p => p.category === filters.category)
        }

        if (filters?.sort) {
            results = results.sort((a, b) => {
                const priceA = a.priceRange ? (a.priceRange.min + a.priceRange.max) / 2 : 0
                const priceB = b.priceRange ? (b.priceRange.min + b.priceRange.max) / 2 : 0

                switch (filters.sort) {
                    case 'price_asc': return priceA - priceB
                    case 'price_desc': return priceB - priceA
                    case 'newest':
                        return (new Date(b.lastUpdate || 0).getTime()) - (new Date(a.lastUpdate || 0).getTime())
                    default: return 0
                }
            })
        }

        return results
    }

    async getRecentProducts(): Promise<ProductDTO[]> {
        await new Promise(r => setTimeout(r, 500))
        return this.mockProducts
    }

    async getProductById(id: string): Promise<ProductDTO | undefined> {
        await new Promise(r => setTimeout(r, 300))
        return this.mockProducts.find(p => p.id === id)
    }

    async createProduct(data: { name: string, category: string, unit: string }): Promise<ProductDTO> {
        await new Promise(r => setTimeout(r, 800)) // Simulate network
        const newProduct: ProductDTO = {
            id: Math.random().toString(36).substr(2, 9),
            name: data.name,
            category: data.category,
            unit: data.unit,
            lastUpdate: new Date().toISOString()
        }
        this.mockProducts.push(newProduct)
        return newProduct
    }
}

export const instance = new CatalogService()
export { instance as CatalogService, type ProductDTO }
