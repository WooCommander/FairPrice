import { ref, readonly } from 'vue'
import type { User } from '@supabase/supabase-js'

const currentUser = ref<User | null>(null)

export const authStore = {
    currentUser: readonly(currentUser),

    setUser(user: User | null) {
        currentUser.value = user
    }
}
