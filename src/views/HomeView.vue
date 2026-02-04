<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'

const router = useRouter()
const { searchResults, isSearching } = catalogStore

onMounted(() => {
    catalogStore.loadRecentProducts()
})

const goToAddPrice = () => {
    router.push('/add-price')
}
</script>

<template>
    <div class="home-view">
        <header class="home-header">
            <h1>Последние товары</h1>
            <FpButton @click="goToAddPrice">Добавить цену</FpButton>
        </header>

        <div v-if="isSearching" class="loading">
            Загрузка...
        </div>

        <div v-else class="product-grid">
            <FpCard v-for="product in searchResults" :key="product.id" class="product-card"
                @click="router.push(`/product/${product.id}`)">
                <div class="card-content">
                    <h3>{{ product.name }}</h3>
                    <span class="category">{{ product.category }}</span>
                    <div class="price-info" v-if="product.formattedPrice">
                        {{ product.formattedPrice }}
                    </div>
                </div>
            </FpCard>
        </div>

        <div v-if="!isSearching && searchResults.length === 0" class="empty-state">
            <p>Пока нет добавленных товаров</p>
            <FpButton variant="outline" @click="goToAddPrice">Добавить первый</FpButton>
        </div>
    </div>
</template>

<style scoped lang="scss">
.home-view {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-md);
}

.home-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);

    h1 {
        font-size: var(--text-h3);
        margin: 0;
    }
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-md);
}

.product-card {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-2);
    }
}

.card-content {
    h3 {
        margin: 0 0 4px 0;
        font-size: var(--text-body-1);
        font-weight: 600;
    }

    .category {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
        display: block;
        margin-bottom: 12px;
    }

    .price-info {
        font-size: var(--text-h4);
        font-weight: 700;
        color: var(--color-primary);
    }
}

.loading,
.empty-state {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}
</style>
