import { supabase } from '@/api/supabase'
import type { User, Session } from '@supabase/supabase-js'

export class AuthService {
    static async getSession(): Promise<{ session: Session | null }> {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        return data
    }

    static async getUser(): Promise<{ user: User | null }> {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        return data
    }

    static async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    // TODO: Add signIn methods later
}
