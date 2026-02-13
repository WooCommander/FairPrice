import { createRouter, createWebHistory } from 'vue-router'
import { authStore } from '@/modules/auth/store/authStore'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/modules/auth/views/LoginView.vue')
    },
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/ProfileView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/add-price/:id?',
        name: 'AddPrice',
        component: () => import('@/modules/prices/views/AddPriceView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/design-system',
        name: 'DesignSystem',
        component: () => import('@/views/DesignSystemView.vue')
    },
    {
        path: '/search',
        name: 'Search',
        component: () => import('@/views/SearchView.vue')
    },
    {
        path: '/product/:id',
        name: 'Product',
        component: () => import('@/views/ProductView.vue')
    },
    {
        path: '/store/:id',
        name: 'Store',
        component: () => import('@/views/StoreView.vue')
    },
    {
        path: '/category/:id',
        name: 'Category',
        component: () => import('@/views/CategoryView.vue')
    },
    {
        path: '/shopping-list',
        name: 'ShoppingList',
        component: () => import('@/views/ShoppingListView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/quick-calc',
        name: 'QuickCalc',
        component: () => import('@/views/QuickCalcView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Guard placeholder
// Guard placeholder
router.beforeEach(async (to, _from, next) => {
    const { isAuthenticated, isLoading } = authStore

    // Wait for auth init if needed (simple check)
    // In real app we might wait for a promise
    if (isLoading.value) {
        // console.log('Auth loading...')
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !isAuthenticated.value) {
        next('/login')
    } else {
        next()
    }
})

export default router
