<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CatalogService } from '../services/CatalogService'
import { catalogStore } from '../store/catalogStore'
import ProductCard from '../components/ProductCard.vue'
import FpInput from '@/design-system/components/FpInput.vue'

const router = useRouter()
const searchQuery = ref('')
let debounceTimer: any = null

const handleSearch = async (val: string | number) => {
    const query = String(val)
    searchQuery.value = query

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
        catalogStore.setSearching(true)
        try {
            const results = await CatalogService.searchProducts(query)
            catalogStore.setSearchResults(results)
        } finally {
            catalogStore.setSearching(false)
        }
    }, 300)
}

const goToDetails = (id: string) => {
    router.push(`/product/${id}`)
}
</script>

<template>
    <div class="search-view">
        <div class="search-header">
            <FpInput v-model="searchQuery" label="Search products..." @update:modelValue="handleSearch" />
        </div>

        <div class="results-list">
            <div v-if="catalogStore.isSearching.value" class="loading">
                Searching...
            </div>

            <div v-else-if="catalogStore.searchResults.value.length > 0">
                <ProductCard v-for="product in catalogStore.searchResults.value" :key="product.id" :product="product"
                    @click="goToDetails" />
            </div>

            <div v-else-if="searchQuery && !catalogStore.isSearching.value" class="empty-state">
                No products found.
            </div>

            <div v-else class="empty-state">
                Start typing to find products.
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.search-view {
    padding: var(--spacing-md);
}

.loading,
.empty-state {
    text-align: center;
    color: var(--color-text-secondary);
    margin-top: var(--spacing-lg);
}
</style>
