<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'

import { FpSpinner } from '@/design-system'

const route = useRoute()
const router = useRouter()
const categoryName = ref('')
const isLoading = ref(true)

const { searchResults } = catalogStore

const groupedProducts = computed(() => {
    const groups: Record<string, any[]> = {}

    // Sort by store name first, then product name
    const sorted = [...searchResults.value].sort((a, b) => {
        const storeA = a.lastStore || 'Неизвестно'
        const storeB = b.lastStore || 'Неизвестно'
        if (storeA !== storeB) return storeA.localeCompare(storeB)
        return a.name.localeCompare(b.name)
    })

    sorted.forEach(product => {
        const store = product.lastStore || 'Без магазина'
        if (!groups[store]) {
            groups[store] = []
        }
        groups[store].push(product)
    })

    return groups
})

const loadData = async () => {
    // We use :id in router for consistency, which holds the category name
    const name = route.params.id as string
    if (!name) return
    categoryName.value = name
    isLoading.value = true
    try {
        await catalogStore.loadProductsByCategory(name)
    } finally {
        isLoading.value = false
    }
}

onMounted(loadData)

watch(() => route.params.id, loadData)

const goToAddProduct = () => {
    router.push({
        path: '/add-price',
        query: { category: categoryName.value }
    })
}
</script>

<template>
    <div class="category-view">

        <header class="ergo-header">
            <div class="header-inner">
                <button class="nav-btn" @click="router.back()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="header-title">
                    {{ categoryName }}
                </div>
                <div class="header-controls">
                    <button class="nav-btn add-btn" @click="router.push(`/add-price?category=${categoryName}`)"
                        title="Добавить товар">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </header>

        <div v-if="isLoading" class="loading">
            <FpSpinner />
        </div>

        <div v-else-if="searchResults.length === 0" class="empty-state">
            <p>В этой категории пока нет товаров.</p>
            <FpButton @click="goToAddProduct">Добавить первый товар</FpButton>
        </div>

        <div v-else class="products-grid">
            <template v-if="Object.keys(groupedProducts).length > 0">
                <div v-for="(products, store) in groupedProducts" :key="store" class="store-group">
                    <h2 class="store-header">🏪 {{ store }}</h2>
                    <FpCard v-for="product in products" :key="product.id" class="product-card"
                        @click="router.push(`/product/${product.id}`)">
                        <div class="product-info">
                            <h3>{{ product.name }}</h3>
                            <span class="unit">{{ product.unit }}</span>
                        </div>
                        <div class="price-info">
                            <span class="price">{{ product.formattedPrice }}</span>
                            <span class="date">{{ product.lastUpdateRelative }}</span>
                        </div>
                    </FpCard>
                </div>
            </template>
            <template v-else>
                <FpCard v-for="product in searchResults" :key="product.id" class="product-card"
                    @click="router.push(`/product/${product.id}`)">
                    <div class="product-info">
                        <h3>{{ product.name }}</h3>
                        <span class="unit">{{ product.unit }}</span>
                    </div>
                    <div class="price-info">
                        <span class="price">{{ product.formattedPrice }}</span>
                        <span class="store" v-if="product.lastStore">@ {{ product.lastStore }}</span>
                    </div>
                </FpCard>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
.category-view {
    padding: 0 0.5rem;
}

.store-group {
    margin-bottom: var(--spacing-lg);
}

.store-header {
    font-size: var(--text-h4);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-sm);
    padding-left: 4px;
    border-bottom: 2px solid var(--color-border);
    padding-bottom: 4px;
}

.ergo-header {
    background: var(--color-surface);
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--color-border);
    // Negative margin to overflow the 0.5rem padding
    margin: 0 -0.5rem var(--spacing-md) -0.5rem;
    padding: 12px 16px;
    display: flex;
    justify-content: center;
}

.header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: var(--layout-max-width);
}

.header-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    text-transform: capitalize;
}

.nav-btn {
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:active {
        background: var(--color-surface-hover);
        color: var(--color-text-primary);
    }
}

.add-btn {
    color: var(--color-primary); // Make add button colored
}

.products-grid {
    display: grid;
    gap: var(--spacing-md);
}

.product-card {
    display: flex !important;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
    }
}

.product-info h3 {
    margin: 0;
    font-size: var(--text-body-1);
    font-weight: 600;
}

.unit {
    font-size: var(--text-caption);
    color: var(--color-text-secondary);
}

.price-info {
    text-align: right;
    display: flex;
    flex-direction: column;
}

.price {
    font-weight: 700;
    color: var(--color-primary);
}

.store {
    font-size: var(--text-caption);
    color: var(--color-text-tertiary);
}

.empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
}
</style>
