export interface AddPriceDTO {
    productId: string
    storeName: string // MVP: Just name for now
    price: number
    currency: 'UZS'
}

class PriceService {
    private mockStores: { id: string, name: string }[] = [
        { id: '1', name: 'Корзинка' },
        { id: '2', name: 'Макро' },
        { id: '3', name: 'Хавас' },
        { id: '4', name: 'Чорсу Базар' },
        { id: '5', name: 'Эко Базар' },
        { id: '6', name: 'Алайский' }
    ]

    async addPrice(dto: AddPriceDTO): Promise<void> {
        // Mock API delay
        await new Promise(r => setTimeout(r, 800))

        // Save new store if it doesn't exist
        if (dto.storeName) {
            const exists = this.mockStores.find(s => s.name.toLowerCase() === dto.storeName.toLowerCase())
            if (!exists) {
                this.mockStores.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: dto.storeName
                })
            }
        }

        // In real app, this would POST /api/prices
        console.log('[PriceService] Price reported:', dto)
    }

    async getStores(query: string = ''): Promise<{ id: string, name: string }[]> {
        await new Promise(r => setTimeout(r, 300))

        if (!query) return this.mockStores
        return this.mockStores.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    }
}

export const instance = new PriceService()
export { instance as PriceService }
