import { supabase } from '@/api/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export type { User, Session, AuthError }

class AuthService {
    async getSession(): Promise<{ session: Session | null }> {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        return data
    }

    async getUser(): Promise<{ user: User | null }> {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
            // If session is missing, it's not a critical system error, just a guest state
            // Supabase JS v2 usually returns null user if no session, but let's be safe
            return { user: null }
        }
        return data
    }

    async signInWithPassword(email: string, password: string) {
        return await supabase.auth.signInWithPassword({
            email,
            password
        })
    }

    async signUp(email: string, password: string) {
        return await supabase.auth.signUp({
            email,
            password
        })
    }

    async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    async getUserStats() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        // Parallel fetch for speed
        const [products, prices] = await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('created_by', user.id),
            supabase.from('prices').select('id', { count: 'exact', head: true }).eq('created_by', user.id)
        ])

        // Level Calculation
        const totalPoints = (products.count || 0) * 20 + (prices.count || 0) * 5
        let level = 1
        let title = 'Новичок'
        let nextLevelThreshold = 100

        if (totalPoints >= 2500) { level = 5; title = 'Хранитель'; nextLevelThreshold = 5000 }
        else if (totalPoints >= 1000) { level = 4; title = 'Мастер'; nextLevelThreshold = 2500 }
        else if (totalPoints >= 500) { level = 3; title = 'Эксперт'; nextLevelThreshold = 1000 }
        else if (totalPoints >= 100) { level = 2; title = 'Исследователь'; nextLevelThreshold = 500 }

        return {
            joinedDate: new Date(user.created_at || Date.now()),
            reputation: totalPoints,
            pricesSubmitted: prices.count || 0,
            productsCreated: products.count || 0,
            topCategory: 'Бакалея', // Placeholder
            level,
            levelTitle: title,
            nextLevelThreshold
        }
    }

    async getUserActivity() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data } = await supabase
            .from('prices')
            .select(`
                id,
                price,
                created_at,
                products (name, unit)
            `)
            .eq('created_by', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

        // Type the response to avoid 'any'
        interface PriceActivity {
            id: string
            price: number
            created_at: string
            products: { name: string; unit: string } | null // Single object because of foreign key
        }

        const typedData = data as unknown as PriceActivity[]

        return typedData?.map(item => ({
            id: item.id,
            action: 'Добавил цену',
            item: item.products?.name || 'Товар',
            details: `${item.price.toLocaleString()} ₽`, // Format price
            time: new Date(item.created_at).toLocaleDateString('ru-RU'),
            icon: '🏷️'
        })) || []
    }
}

export const instance = new AuthService()
export { instance as AuthService }
