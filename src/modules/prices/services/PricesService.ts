
// import { supabase } from '@/api/supabase'

export interface PriceReport {
    productId: string
    placeId?: string // Optional for now (free text)
    placeName: string
    price: number
    userId: string
    dateObserved: string
}

class PricesService {
    async addPriceReport(report: PriceReport): Promise<void> {
        // For MVP we just console log or maybe try to save to a partial DB
        console.log('Saving price report:', report)

        // Simulate API call
        await new Promise(r => setTimeout(r, 600))

        // TODO: Real Supabase Insert
        // const { error } = await supabase.from('price_reports').insert(report)
        // if (error) throw error
    }
}

export const instance = new PricesService()
export { instance as PricesService }
