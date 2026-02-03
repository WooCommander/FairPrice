<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '../store/catalogStore'
import ProductCard from '../components/ProductCard.vue'
import FpInput from '@/design-system/components/FpInput.vue'

const router = useRouter()
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedSort = ref('')
let debounceTimer: any = null

// Use computed to access store state reliably
const searchResults = computed(() => catalogStore.searchResults.value)
const isSearching = computed(() => catalogStore.isSearching.value)

const performSearch = async () => {
    await catalogStore.searchProducts(searchQuery.value, {
        category: selectedCategory.value || undefined,
        sort: selectedSort.value || undefined
    })
}

const handleSearch = (val: string | number) => {
    searchQuery.value = String(val)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(performSearch, 300)
}

// Watch filters to trigger search immediately
watch([selectedCategory, selectedSort], () => {
    performSearch()
})

const goToDetails = (id: string) => {
    router.push(`/product/${id}`)
}

onMounted(() => {
    performSearch()
})
</script>

<template>
    <div class="search-view">
        <div class="search-header">
            <!-- DEBUG INFO: REMOVE LATER -->
            <div style="font-size: 10px; color: grey;">
                Results: {{ searchResults.length }} | Query: "{{ searchQuery }}" | Searching: {{ isSearching }}
            </div>

            <FpInput v-model="searchQuery" label="Поиск продуктов" @update:modelValue="handleSearch" placeholder="Название..." />
            
            <div class="filters-row">
                <select v-model="selectedCategory" class="filter-select">
                    <option value="">Все категории</option>
                    <option value="Овощи">Овощи</option>
                    <option value="Мясо">Мясо</option>
                    <option value="Бакалея">Бакалея</option>
                </select>

                <select v-model="selectedSort" class="filter-select">
                    <option value="">По умолчанию</option>
                    <option value="price_asc">Сначала дешевые</option>
                    <option value="price_desc">Сначала дорогие</option>
                    <option value="newest">Новые</option>
                </select>
            </div>
        </div>

        <div class="results-list">
            <div v-if="isSearching" class="loading">
                Поиск...
            </div>

            <div v-else-if="searchResults.length > 0">
                <ProductCard v-for="product in searchResults" :key="product.id" :product="product"
                    @click="goToDetails" />
            </div>

            <div v-else-if="searchQuery || selectedCategory" class="empty-state">
                Ничего не найдено.
            </div>

            <div v-else class="empty-state">
                Начните ввод или выберите категорию.
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.search-view {
    padding: var(--spacing-md);
    max-width: 800px;
    margin: 0 auto;
}

.search-header {
    background: var(--color-surface);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--spacing-lg);
    border: 1px solid var(--color-border);
}

.filters-row {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
}

.filter-select {
    flex: 1;
    padding: 10px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background-color: var(--color-background);
    font-size: var(--text-body-2);
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: var(--font-family);

    &:focus {
        outline: none;
        border-color: var(--color-primary);
    }
}

.loading,
.empty-state {
    text-align: center;
    color: var(--color-text-secondary);
    margin-top: var(--spacing-lg);
    font-size: var(--text-body-2);
}
</style>
