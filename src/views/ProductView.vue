<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import { catalogStore } from '@/modules/catalog/store/catalogStore'

const route = useRoute()
const router = useRouter()
const { currentProduct } = catalogStore

onMounted(async () => {
    const id = route.params.id as string
    if (id) {
        await catalogStore.loadProductById(id)
    }
})

const latestHistory = computed(() => {
    if (!currentProduct.value?.history) return []

    const uniqueStores = new Map()
    // History is sorted by date desc (from service/adapter)
    // We want ONE entry per store (the latest one)

    currentProduct.value.history.forEach(h => {
        if (!uniqueStores.has(h.storeName)) {
            uniqueStores.set(h.storeName, h)
        }
    })

    return Array.from(uniqueStores.values())
})

const goToAddPrice = () => {
    if (currentProduct.value) {
        // Navigate to Add Price view, ideally pre-selecting this product
        // Assuming AddPriceView handles logic if we pass ID or just basic navigation
        // For now, consistent with user flow:
        router.push('/add-price')
    }
}
</script>

<template>
    <div class="product-view">
        <header class="page-header">
            <FpButton variant="text" size="sm" @click="router.back()">← Назад</FpButton>
            <h1>Товар</h1>
        </header>

        <div v-if="currentProduct">
            <FpCard class="main-card">
                <div class="product-header">
                    <h2>{{ currentProduct.name }}</h2>
                    <span class="category-badge">{{ currentProduct.category }}</span>
                </div>

                <div class="main-stats">
                    <div class="stat-block">
                        <span class="label">Последняя цена</span>
                        <div class="price-row">
                            <span class="price">{{ currentProduct.formattedPrice }}</span>
                            <span class="unit" v-if="currentProduct.unit">/ {{ currentProduct.unit }}</span>
                        </div>
                    </div>
                </div>

                <div class="meta-info">
                    <p>Обновлено: {{ currentProduct.lastUpdateRelative }}</p>
                    <p v-if="currentProduct.storeName">📍 {{ currentProduct.storeName }}</p>
                </div>

                <div class="actions">
                    <FpButton size="full" @click="goToAddPrice">
                        Добавить новую цену
                    </FpButton>
                </div>
            </FpCard>

            <div class="history-section">
                <h3>Цены в магазинах</h3>
                <div v-if="latestHistory.length === 0" class="empty-state">
                    История цен пуста
                </div>
                <div v-else class="history-list">
                    <div v-for="(item, idx) in latestHistory" :key="idx" class="history-item">
                        <div class="history-header">
                            <span class="store-name">{{ item.storeName }}</span>
                            <span class="item-date">{{ item.dateRelative }}</span>
                        </div>
                        <div class="price-info">
                            <strong class="item-price">{{ item.price.toLocaleString() }} ₽</strong>
                            <span class="item-unit">за {{ item.unit }}</span>
                        </div>
                        <div class="author-info">
                            👤 {{ item.author }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="loading">
            Загрузка...
        </div>
    </div>
</template>

<style scoped lang="scss">
.product-view {
    max-width: 600px;
    margin: 0 auto;
    padding: var(--spacing-md);
}

.page-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);

    h1 {
        margin: 0;
        font-size: var(--text-h3);
    }
}

.main-card {
    margin-bottom: var(--spacing-lg);
}

.product-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-lg);

    h2 {
        margin: 0;
        font-size: var(--text-h4);
        line-height: 1.3;
    }
}

.category-badge {
    background: var(--color-background);
    color: var(--color-text-secondary);
    padding: 4px 8px;
    border-radius: 99px;
    font-size: var(--text-caption);
    white-space: nowrap;
    margin-left: 8px;
}

.main-stats {
    margin-bottom: var(--spacing-md);
}

.stat-block {
    .label {
        display: block;
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
        margin-bottom: 4px;
    }
}

.price-row {
    display: flex;
    align-items: baseline;
    gap: 4px;

    .price {
        font-size: 32px;
        font-weight: 700;
        color: var(--color-primary);
    }

    .unit {
        font-size: var(--text-body-1);
        color: var(--color-text-secondary);
    }
}

.meta-info {
    font-size: var(--text-caption);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-lg);
    line-height: 1.5;

    p {
        margin: 4px 0;
    }
}

.history-section {
    h3 {
        font-size: var(--text-h4);
        margin-bottom: var(--spacing-md);
    }
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.history-item {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .store-name {
        font-weight: 600;
        font-size: var(--text-body-1);
    }

    .item-date {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
    }
}

.price-info {
    display: flex;
    align-items: baseline;
    gap: 8px;

    .item-price {
        font-size: var(--text-h5);
        color: var(--color-primary);
    }

    .item-unit {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
    }
}

.author-info {
    font-size: var(--text-caption);
    color: var(--color-text-tertiary);
    /* Lighter gray */
    display: flex;
    align-items: center;
    gap: 6px;
}

.empty-state {
    text-align: center;
    padding: 32px;
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    border: 1px dashed var(--color-border);
}

.loading {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
}
</style>
