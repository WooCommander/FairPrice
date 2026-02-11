<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpBackButton from '@/design-system/components/FpBackButton.vue'

const router = useRouter()
const { searchResults, isSearching } = catalogStore

const query = ref('')
const selectedCategory = ref<string | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined

const categories = [
    'Овощи', 'Фрукты', 'Мясо', 'Бакалея', 'Молочные продукты', 'Напитки', 'Бытовая химия'
]

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

const selectCategory = (cat: string) => {
    if (selectedCategory.value === cat) {
        selectedCategory.value = null
    } else {
        selectedCategory.value = cat
    }
    performSearch()
}

// Initial search on mount (empty or if coming with params?)
onMounted(() => {
    performSearch()
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
                    <input v-model="query" type="text" class="search-input" placeholder="Поиск товаров..."
                        @input="handleSearch" autofocus />
                    <span v-if="query" class="clear-btn" @click="query = ''; handleSearch()">✕</span>
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
            <div v-if="isSearching" class="loading-state">
                <div class="spinner"></div>
                <span>Поиск...</span>
            </div>

            <div v-else-if="searchResults.length > 0" class="results-grid">
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

            <div v-else class="empty-state">
                <span class="empty-icon">🔍</span>
                <p>Ничего не найдено</p>
                <button class="add-btn" @click="router.push('/add-price')">Добавить этот товар</button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.search-view {
    padding-bottom: 80px; // Space for bottom nav if present
}

.search-header {
    position: sticky;
    top: 0;
    background: var(--color-background);
    z-index: 10;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
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

.search-input {
    width: 100%;
    padding: 10px 16px;
    padding-right: 40px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    font-size: var(--text-body-1);
    outline: none;

    &:focus {
        border-color: var(--color-primary);
    }
}

.clear-btn {
    position: absolute;
    right: 12px;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-weight: bold;
}

.filters {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none; // Hide scrollbar for cleaner look

    &::-webkit-scrollbar {
        display: none;
    }
}

.filter-chip {
    white-space: nowrap;
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: var(--text-caption);
    cursor: pointer;
    transition: all 0.2s;

    &.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
    }
}

.results-list {
    padding: var(--spacing-md);
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
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
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
    }

    .store {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
    }
}

.empty-state {
    text-align: center;
    padding: var(--spacing-2xl);

    .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: var(--spacing-md);
        opacity: 0.3;
    }

    p {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-lg);
    }

    .add-btn {
        background: none;
        border: none;
        color: var(--color-primary);
        font-weight: 600;
        cursor: pointer;
    }
}
</style>
