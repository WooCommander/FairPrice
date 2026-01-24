import { authStore } from '../store/authStore'
import { AuthService } from '../services/AuthService'
import { supabase } from '@/api/supabase'
import { AppService } from '@/services/AppService'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Initialize logic
const initAuth = async () => {
    AppService.setLoading(true)
    try {
        const { user } = await AuthService.getUser()
        authStore.setUser(user)
    } catch (e) {
        console.error('Auth initialization error:', e)
    } finally {
        AppService.setLoading(false)
    }

    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        authStore.setUser(session?.user ?? null)
    })
}

export function useAuth() {
    return {
        currentUser: authStore.currentUser,
        initAuth,
        signOut: AuthService.signOut.bind(AuthService)
    }
}
