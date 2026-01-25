import { supabase } from '@/api/supabase'
import type { User, Session } from '@supabase/supabase-js'

class AuthService {
    async getSession(): Promise<{ session: Session | null }> {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        return data
    }

    async getUser(): Promise<{ user: User | null }> {
        try {
            const { data, error } = await supabase.auth.getUser()
            if (error) {
                // If session is missing, it's not a critical system error, just a guest state
                if (error.name === 'AuthSessionMissingError') {
                    return { user: null }
                }
                throw error
            }
            return data
        } catch (e: any) {
            // Check for specific error message if name check fails
            if (e?.name === 'AuthSessionMissingError' || e?.message?.includes('Auth session missing')) {
                return { user: null }
            }
            throw e
        }
    }

    async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    // Mock stats for MVP
    async getUserStats() {
        return {
            joinedDate: new Date(2025, 10, 15),
            reputation: 1250,
            pricesSubmitted: 42,
            moneySaved: 850000,
            topCategory: 'Groceries'
        }
    }
}

export const instance = new AuthService()
export { instance as AuthService }
