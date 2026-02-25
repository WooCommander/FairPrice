<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { PRODUCT_CATEGORIES } from '@/modules/catalog/constants'
import FpCard from '@/design-system/components/FpCard.vue'
import FpBackButton from '@/design-system/components/FpBackButton.vue'
import FpSearchInput from '@/design-system/components/FpSearchInput.vue'

const router = useRouter()
const { searchResults, isSearching, hasMore } = catalogStore

const query = ref('')
const selectedCategory = ref<string | null>(null)
const observerTarget = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined

const categories = PRODUCT_CATEGORIES

const handleSearch = () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        performSearch()
    }, 300)
}

const performSearch = async () => {
    await catalogStore.searchProducts(query.value, {
        category: selectedCategory.value || undefined
    })
}

const loadMore = async () => {
    if (isSearching.value || !hasMore.value) return
    await catalogStore.loadMore()
}

const selectCategory = (cat: string) => {
    if (selectedCategory.value === cat) {
        selectedCategory.value = null
    } else {
        selectedCategory.value = cat
    }
    performSearch()
}

// Infinite Scroll Observer
const setupObserver = () => {
    if (observer) observer.disconnect()

    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore.value && !isSearching.value) {
            loadMore()
        }
    }, {
        root: null,
        rootMargin: '100px', // Load before reaching bottom
        threshold: 0.1
    })

    if (observerTarget.value) {
        observer.observe(observerTarget.value)
    }
}

// Initial search on mount (empty or if coming with params?)
onMounted(() => {
    performSearch()
    setupObserver()
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})

const goToProduct = (id: string) => {
    router.push(`/product/${id}`)
}
</script>

<template>
    <div class="search-view">
        <header class="search-header">
            <div class="search-bar">
                <FpBackButton />
                <div class="input-container">
                    <FpSearchInput v-model="query" placeholder="Поиск товаров..." :autofocus="true"
                        @update:modelValue="handleSearch" />
                </div>
            </div>

            <div class="filters">
                <button v-for="cat in categories" :key="cat" class="filter-chip"
                    :class="{ active: selectedCategory === cat }" @click="selectCategory(cat)">
                    {{ cat }}
                </button>
            </div>
        </header>

        <div class="results-list">

            <div v-if="!query && catalogStore.searchHistory.value.length > 0" class="history-section">
                <div class="history-header">
                    <span>История поиска</span>
                    <button class="clear-history-btn" @click="catalogStore.clearHistory()">Очистить</button>
                </div>
                <div class="history-chips">
                    <button v-for="term in catalogStore.searchHistory.value" :key="term" class="history-chip"
                        @click="query = term; handleSearch()">
                        {{ term }}
                    </button>
                </div>
            </div>

            <div v-if="searchResults.length > 0" class="results-grid">
                <FpCard v-for="item in searchResults" :key="item.id" class="result-card" @click="goToProduct(item.id)">
                    <div class="card-content">
                        <div class="main-info">
                            <h3>{{ item.displayName }}</h3>
                            <span class="category">{{ item.category }}</span>
                        </div>
                        <div class="price-info">
                            <span class="price">{{ item.formattedPrice }}</span>
                            <span v-if="item.lastStore" class="store">{{ item.lastStore }}</span>
                        </div>
                    </div>
                </FpCard>
            </div>

            <!-- Loading Indicator / Observer Target -->
            <div ref="observerTarget" class="loading-trigger">
                <div v-if="isSearching" class="spinner"></div>
                <!-- Optional: Text like "Loading more..." -->
            </div>

            <div v-if="!isSearching && searchResults.length === 0" class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>Ничего не найдено</p>
                <div class="wrapper">
                    <button class="add-btn" @click="router.push('/add-price')">Добавить этот товар</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.search-view {
    padding-bottom: 0; // Padding handled by layout or bottom nav
    flex: 1; // Fill container
    display: flex;
    flex-direction: column;
    overflow: hidden; // Prevent document scroll trigger
    max-height: 100%; // Constrain to parent
}

.search-header {
    position: sticky;
    top: 0;
    background: var(--color-background);
    z-index: 10;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0; // Don't shrink header
}

.search-bar {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
}

.input-container {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
}

.filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap; // Wrap tags to see them all
    padding-bottom: 8px;
}

.filter-chip {
    white-space: nowrap;
    padding: 6px 16px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: var(--text-caption);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
    }

    &:hover:not(.active) {
        border-color: var(--color-primary);
        color: var(--color-primary);
    }
}

.results-list {
    padding: var(--spacing-md);
    flex: 1;
    overflow-y: auto; // Internal scroll
    padding-bottom: 80px; // Extra space for mobile nav/fab
}

.loading-trigger {
    display: flex;
    justify-content: center;
    padding: var(--spacing-md);
    min-height: 50px;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    gap: var(--spacing-md);
    color: var(--color-text-secondary);
}

.spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
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
        font-weight: 500;
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
    padding-top: 100px;
    text-align: center;

    .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: var(--spacing-md);
        opacity: 0.5;
    }

    p {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-lg);
    }

    .wrapper {
        display: flex;
        justify-content: center;
    }

    .add-btn {
        background: none;
        border: 1px solid var(--color-primary);
        padding: 8px 16px;
        border-radius: var(--radius-sm);
        color: var(--color-primary);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: rgba(var(--color-primary-rgb), 0.1);
        }
    }
}

.history-section {
    padding-bottom: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);

    span {
        font-size: var(--text-caption);
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
    }
}

.clear-history-btn {
    background: none;
    border: none;
    color: var(--color-text-tertiary);
    font-size: var(--text-caption);
    cursor: pointer;

    &:hover {
        color: var(--color-error);
    }
}

.history-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.history-chip {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 6px 12px;
    border-radius: var(--radius-lg); // More rounded for history
    font-size: var(--text-body-2);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;

    &::before {
        content: '🕒';
        font-size: 10px;
        opacity: 0.5;
    }

    &:hover {
        border-color: var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.05);
    }
}
</style>
