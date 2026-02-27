<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { catalogStore } from '../store/catalogStore'
import { useRouter } from 'vue-router'
import FpCard from '@/design-system/components/FpCard.vue'
import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpSpinner from '@/design-system/components/FpSpinner.vue'

const router = useRouter()
const searchQuery = ref('')

const products = computed(() => catalogStore.searchResults.value)
const isLoading = computed(() => catalogStore.isLoading.value)

const handleSearch = () => {
    catalogStore.searchProducts(searchQuery.value)
}

onMounted(() => {
    catalogStore.searchProducts('')
})

const addPrice = (productId: string) => {
    router.push(`/add-price/${productId}`)
}
</script>

<template>
    <div class="catalog-list-view">
        <header class="ergo-header">
            <div class="header-inner">
                <button class="nav-btn" @click="router.push('/')">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="header-title">Каталог товаров</div>
                <div style="width: 40px"></div>
            </div>
        </header>

        <section class="search-section">
            <FpCard>
                <div class="search-bar">
                    <FpInput v-model="searchQuery" placeholder="Поиск товара..." @keydown.enter="handleSearch"
                        class="flex-grow" />
                    <FpButton @click="handleSearch">Найти</FpButton>
                </div>
            </FpCard>
        </section>

        <section class="list-section">
            <div v-if="isLoading && products.length === 0" class="loading">
                <FpSpinner />
            </div>

            <div v-else-if="products.length === 0" class="empty">
                Ничего не найдено.
            </div>

            <div v-else class="product-grid">
                <div v-for="product in products" :key="product.id" class="product-item"
                    @click="router.push(`/product/${product.id}`)">
                    <FpCard class="item-card">
                        <div class="item-content">
                            <div class="item-info">
                                <h3 class="name">{{ product.name }}</h3>
                                <span class="category">{{ product.category }}</span>
                            </div>
                            <FpButton size="sm" variant="secondary" @click.stop="addPrice(product.id)">+ Цена</FpButton>
                        </div>
                    </FpCard>
                </div>
            </div>

            <div v-if="catalogStore.hasMore.value" class="load-more">
                <FpButton variant="outline" :loading="isLoading" @click="catalogStore.loadMore()">Загрузить еще
                </FpButton>
            </div>
        </section>
    </div>
</template>

<style scoped lang="scss">
.catalog-list-view {
    padding: 0 0.5rem;
    max-width: 100%; // Allow more width

}

.ergo-header {
    background: var(--color-surface);
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid var(--color-border);
    margin: 0 -0.5rem var(--spacing-md) -0.5rem;
    padding: 12px 16px;
}

.header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.header-title {
    font-size: 1.125rem;
    font-weight: 600;
}

.nav-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;

    &:active {
        background: var(--color-surface-hover);
    }
}

.search-section {
    margin-bottom: var(--spacing-md);
}

.search-bar {
    display: flex;
    gap: 8px;

    .flex-grow {
        flex: 1;
    }
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
}

.item-card {
    transition: transform 0.2s;

    &:active {
        transform: scale(0.98);
    }
}

.item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.item-info {
    .name {
        margin: 0;
        font-size: var(--text-body-1);
        font-weight: 600;
    }

    .category {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
    }
}

.loading,
.empty {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-secondary);
}

.load-more {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
    padding-bottom: 3rem;
}
</style>
