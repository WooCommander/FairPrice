<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpBreadcrumbs from '@/design-system/components/FpBreadcrumbs.vue'

const route = useRoute()
const router = useRouter()
const categoryName = ref('')
const isLoading = ref(true)

const { searchResults } = catalogStore

const loadData = async () => {
    const name = route.params.name as string
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

watch(() => route.params.name, loadData)

const goToAddProduct = () => {
    // Navigate to Add Price (which allows creating product).
    // Ideally we'd pre-fill category.
    router.push('/add-price')
}
</script>

<template>
    <div class="category-view">
        <FpBreadcrumbs :items="[
            { label: 'Главная', to: '/' },
            { label: categoryName || 'Категория' }
        ]" />
        <header class="page-header">
            <FpButton variant="text" size="sm" @click="router.back()">← Назад</FpButton>
            <h1>{{ categoryName }}</h1>
            <p class="subtitle">Все товары в категории</p>
        </header>

        <div v-if="isLoading" class="loading">Загрузка...</div>

        <div v-else-if="searchResults.length === 0" class="empty-state">
            <p>В этой категории пока нет товаров.</p>
            <FpButton @click="goToAddProduct">Добавить первый товар</FpButton>
        </div>

        <div v-else class="products-grid">
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
        </div>
    </div>
</template>

<style scoped lang="scss">
.page-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);

    h1 {
        margin: var(--spacing-sm) 0 4px;
        font-size: var(--text-h3);
        text-transform: capitalize;
    }

    .subtitle {
        color: var(--color-text-secondary);
        margin: 0;
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
