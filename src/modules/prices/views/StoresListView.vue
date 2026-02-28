<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { priceStore } from '../store/priceStore'
import { useRouter } from 'vue-router'
import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpSpinner from '@/design-system/components/FpSpinner.vue'

const router = useRouter()
const searchQuery = ref('')
const stores = ref<{ id: string, name: string }[]>([])
const isLoading = ref(false)

const handleSearch = async () => {
    isLoading.value = true
    try {
        stores.value = await priceStore.getStores(searchQuery.value)
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    handleSearch()
})

const viewStore = (storeId: string) => {
    router.push({ path: '/catalog', query: { storeId } })
}
</script>

<template>
    <div class="stores-list-view">
        <div class="page-title-row">
            <h1 class="page-title">Места</h1>
            <FpButton size="sm" @click="router.push('/create-store')">Добавить</FpButton>
        </div>

        <div class="sticky-search-wrapper">
            <div class="search-input-group">
                <FpInput v-model="searchQuery" placeholder="Поиск магазина..." @keydown.enter="handleSearch"
                    class="flex-grow" />
                <FpButton @click="handleSearch">Найти</FpButton>
            </div>
        </div>

        <section class="list-section">
            <div v-if="isLoading && stores.length === 0" class="loading">
                <FpSpinner />
            </div>

            <div v-else-if="stores.length === 0" class="empty">
                Ничего не найдено.
            </div>

            <div v-else class="standard-grid">
                <div v-for="store in stores" :key="store.id" class="fp-tile" @click="viewStore(store.id)">
                    <div class="tile-info">
                        <span class="subtitle">Магазин</span>
                        <h3 class="title">{{ store.name }}</h3>
                    </div>
                    <div class="tile-footer">
                        <span class="extra-info">Смотреть товары</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped lang="scss">
.stores-list-view {
    padding: 0 0.5rem;
}

.loading,
.empty {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-secondary);
}
</style>
