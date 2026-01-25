
export interface PricePoint {
    date: string
    price: number
}

export interface CheapPlace {
    placeName: string
    price: number
    distance?: string
}

class AnalyticsService {
    async getPriceHistory(_productId: string, period: '7d' | '30d' | '90d' = '7d'): Promise<PricePoint[]> {
        // Generate mock history
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
        const data: PricePoint[] = []
        const now = new Date()

        // Base price ~5000 +- 20%
        const basePrice = 5000

        for (let i = days; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)

            const randomVar = (Math.random() - 0.5) * 1000
            data.push({
                date: d.toLocaleDateString(),
                price: Math.floor(basePrice + randomVar)
            })
        }

        return data
    }

    async getBestPlaces(_productId: string): Promise<CheapPlace[]> {
        return [
            { placeName: 'Makro (Yunusabad)', price: 4500, distance: '2 km' },
            { placeName: 'Chorsu Bazaar', price: 4200, distance: '5 km' },
            { placeName: 'Korzinka (Aeroport)', price: 4800, distance: '8 km' }
        ]
    }
}

export const instance = new AnalyticsService()
export { instance as AnalyticsService }
