<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { CatalogService, type ProductDTO } from '@/modules/catalog/services/CatalogService'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import { FpSpinner } from '@/design-system'

const router = useRouter()
const favorites = ref<ProductDTO[]>([])
const isLoading = ref(true)

onMounted(async () => {
    try {
        const favoriteIds = await CatalogService.getFavorites()
        if (favoriteIds.length > 0) {
            favorites.value = await CatalogService.getProductsByIds(favoriteIds)
        }
    } catch (error) {
        console.error('Failed to load favorites:', error)
    } finally {
        isLoading.value = false
    }
})

const goToProduct = (id: string) => {
    router.push(`/product/${id}`)
}
</script>

<template>
    <div class="favorites-view">
        <header class="section-header">
            <h1>Избранное</h1>
            <p v-if="favorites.length > 0">{{ favorites.length }} товаров сохранено</p>
        </header>

        <div v-if="isLoading" class="loading-state">
            <FpSpinner />
        </div>

        <div v-else-if="favorites.length > 0" class="results-grid">
            <FpCard v-for="item in favorites" :key="item.id" class="result-card" @click="goToProduct(item.id)">
                <div class="card-content">
                    <div class="main-info">
                        <h3>{{ item.name }}</h3>
                        <span class="category">{{ item.category }}</span>
                    </div>
                    <div class="price-info">
                        <span class="price">{{ item.lastPrice ? `${item.lastPrice} ₽` : '---' }}</span>
                        <span v-if="item.lastStore" class="store">{{ item.lastStore }}</span>
                    </div>
                </div>
            </FpCard>
        </div>

        <div v-else class="empty-state">
            <span class="empty-icon">⭐</span>
            <h3>Пока пусто</h3>
            <p>Добавляйте товары в избранное, чтобы быстро следить за ценами</p>
            <FpButton size="md" @click="router.push('/search')">Перейти в поиск</FpButton>
        </div>
    </div>
</template>

<style scoped lang="scss">
.favorites-view {
    padding: var(--spacing-md);
    width: 100%;
}

.section-header {
    margin-bottom: var(--spacing-xl);

    h1 {
        font-size: var(--text-h4);
        font-weight: 700;
        margin-bottom: 4px;
    }

    p {
        color: var(--color-text-secondary);
        font-size: var(--text-body-2);
    }
}

.results-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.result-card {
    cursor: pointer;
    transition: transform 0.1s;
    background: var(--color-surface);

    &:active {
        transform: scale(0.98);
    }
}

.card-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.main-info {
    h3 {
        margin: 0;
        font-size: var(--text-body-1);
        font-weight: 600;
        color: var(--color-text-primary);
    }

    .category {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
    }
}

.price-info {
    text-align: right;
    display: flex;
    flex-direction: column;

    .price {
        font-weight: 700;
        color: var(--color-primary);
        font-size: var(--text-body-1);
    }

    .store {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
    }
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;

    .empty-icon {
        font-size: 64px;
        margin-bottom: var(--spacing-md);
        opacity: 0.3;
    }

    h3 {
        font-size: var(--text-h5);
        margin-bottom: 8px;
    }

    p {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-xl);
        max-width: 300px;
    }
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: 60px;
}
</style>
