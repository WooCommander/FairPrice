<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'

const route = useRoute()
const router = useRouter()
const storeId = route.params.id as string
const storeName = ref('Магазин')
const isLoading = ref(true)

/*
    We reuse searchResults from catalogStore to display the list, 
    since it's just a list of products.
*/
const { searchResults } = catalogStore

onMounted(async () => {
    isLoading.value = true
    try {
        storeName.value = await catalogStore.getStoreName(storeId)
        await catalogStore.loadProductsByStore(storeId)
    } finally {
        isLoading.value = false
    }
})

const goToAddPrice = () => {
    // Navigate to Add Price, pre-filling this store? 
    // Currently Add Price flow starts with Product Selection.
    // If we want to pre-fill store, we'd need to support that in AddPriceView.
    // For now, just go to add price generic or maybe we can implement "Select Product -> This Store is default" future task.
    router.push('/add-price')
}
</script>

<template>
    <div class="store-view">
        <header class="page-header">
            <FpButton variant="text" size="sm" @click="router.back()">← Назад</FpButton>
            <h1>{{ storeName }}</h1>
            <p class="subtitle">Товары в этой точке</p>
        </header>

        <div v-if="isLoading" class="loading">Загрузка...</div>

        <div v-else-if="searchResults.length === 0" class="empty-state">
            <p>Здесь пока нет товаров с ценами.</p>
            <FpButton @click="goToAddPrice">Добавить цену</FpButton>
        </div>

        <div v-else class="products-grid">
            <FpCard v-for="product in searchResults" :key="product.id" class="product-card"
                @click="router.push(`/product/${product.id}`)">
                <div class="product-info">
                    <h3>{{ product.name }}</h3>
                    <span class="category">{{ product.category }}</span>
                </div>
                <div class="price-info">
                    <span class="price">{{ product.formattedPrice }}</span>
                    <span class="date">{{ product.lastUpdateRelative }}</span>
                </div>
            </FpCard>
        </div>
    </div>
</template>

<style scoped lang="scss">
.store-view {
    max-width: 800px;
    margin: 0 auto;
}

.page-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);

    h1 {
        margin: var(--spacing-sm) 0 4px;
        font-size: var(--text-h3);
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
    display: flex !important; // Override card default if needed
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

.category {
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

.date {
    font-size: var(--text-caption);
    color: var(--color-text-tertiary);
}

.empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
}
</style>
