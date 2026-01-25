
interface Product {
    id: string;
    name: string;
    category: string;
    unit: string;
}

class CatalogService {
    // Mock data for MVP
    private mockProducts: Product[] = [
        { id: '1', name: 'Картофель', category: 'Овощи', unit: 'kg' },
        { id: '2', name: 'Лук репчатый', category: 'Овощи', unit: 'kg' },
        { id: '3', name: 'Морковь', category: 'Овощи', unit: 'kg' },
        { id: '4', name: 'Говядина (мякоть)', category: 'Мясо', unit: 'kg' },
        { id: '5', name: 'Яйца (10 шт)', category: 'Бакалея', unit: 'pack' },
        { id: '6', name: 'Масло подсолнечное', category: 'Бакалея', unit: 'l' },
    ]

    async searchProducts(query: string): Promise<Product[]> {
        // Simulate API delay
        await new Promise(r => setTimeout(r, 500))

        if (!query) return []

        const lowerQuery = query.toLowerCase()
        return this.mockProducts.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery)
        )
    }

    async getProductById(id: string): Promise<Product | undefined> {
        await new Promise(r => setTimeout(r, 300))
        return this.mockProducts.find(p => p.id === id)
    }
}

export const instance = new CatalogService()
export { instance as CatalogService, type Product }
