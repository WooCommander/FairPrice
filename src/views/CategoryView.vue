<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpBackButton from '@/design-system/components/FpBackButton.vue'
import FpBreadcrumbs from '@/design-system/components/FpBreadcrumbs.vue'

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

        <header class="page-header">
            <FpBackButton />
            <div class="header-title">
                <h1>{{ categoryName }}</h1>
            </div>
            <div class="header-actions">
                <button class="add-btn-icon" @click="router.push(`/add-price?category=${categoryName}`)"
                    title="Добавить товар">
                    +
                </button>
            </div>
        </header>

        <FpBreadcrumbs :items="[
            { label: 'Главная', to: '/' },
            { label: categoryName }
        ]" class="breadcrumbs-container" />

        <div v-if="isLoading" class="loading">Загрузка...</div>

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

.page-header {
    margin-bottom: var(--spacing-lg);

    .header-top {
        display: grid;
        grid-template-columns: 48px 1fr 48px;
        align-items: center;
        margin-bottom: var(--spacing-sm);
    }

    .header-title h1 {
        margin: 0;
        font-size: 24px;
        text-align: center;
        text-transform: capitalize;
        line-height: 1.2;
    }

    .breadcrumbs-container {
        display: flex;
        justify-content: center;
    }

    .header-actions {
        display: flex;
        justify-content: flex-end;
    }

    .add-btn-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--color-primary);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-sm);
        transition: all 0.2s;

        &:hover {
            background: var(--color-primary-variant);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
    }
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
