import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/modules/auth/composables/useAuth'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { requiresAuth: true } // Or false for MVP demo
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Guard placeholder
router.beforeEach(async (to, _from, next) => {
    const { currentUser, isLoading } = useAuth()

    // Wait for auth init if needed
    if (isLoading) {
        // This is a naive wait, ideally useAuth returns a promise or we check a flag
        // For now we rely on main.ts having awaited initAuth before mounting app
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !currentUser.value) {
        console.log('Redirecting to login...')
        // In real app redirect to /login, but here we might just prevent access or show modal
        // For MVP just let them pass but maybe show alert? 
        // Actually, let's redirect to Home since we have login there
        // next('/') <-- DISABLING FOR DEMO
        // Allow pass through for demo so we can see the Profile View
        next()
    } else {
        next()
    }
})

export default router
