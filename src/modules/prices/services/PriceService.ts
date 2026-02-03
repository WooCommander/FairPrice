export interface AddPriceDTO {
    productId: string
    storeName: string // MVP: Just name for now
    price: number
    currency: 'UZS'
}

class PriceService {
    async addPrice(dto: AddPriceDTO): Promise<void> {
        // Mock API delay
        await new Promise(r => setTimeout(r, 800))

        // In real app, this would POST /api/prices
        console.log('[PriceService] Price reported:', dto)

        // Randomly fail for testing error handling? No, keep it stable for now.
    }

    async getStores(query: string = ''): Promise<{ id: string, name: string }[]> {
        await new Promise(r => setTimeout(r, 300))
        const mockStores = [
            { id: '1', name: 'Корзинка' },
            { id: '2', name: 'Макро' },
            { id: '3', name: 'Хавас' },
            { id: '4', name: 'Чорсу Базар' },
            { id: '5', name: 'Эко Базар' },
            { id: '6', name: 'Алайский' }
        ]

        if (!query) return mockStores
        return mockStores.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    }
}

export const instance = new PriceService()
export { instance as PriceService }
