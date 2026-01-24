import { createRouter, createWebHistory } from 'vue-router'
// import { useAuth } from '@/composables/useAuth'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Guard placeholder
router.beforeEach(async (to, _from, next) => {
    // const { initAuth, currentUser } = useAuth()
    // await initAuth() // Ensure auth is ready
    console.log(`Navigating to: ${String(to.name)}`)
    next()
})

export default router
