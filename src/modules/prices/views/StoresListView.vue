<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { priceStore } from '../store/priceStore'
import { useRouter } from 'vue-router'
import FpCard from '@/design-system/components/FpCard.vue'
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
    // For now, redirect to catalog with store filter or just stay here
    router.push({ path: '/catalog', query: { storeId } })
}
</script>

<template>
    <div class="stores-list-view">
        <h1 class="page-title">Места</h1>

        <section class="search-section">
            <FpCard>
                <div class="search-bar">
                    <FpInput v-model="searchQuery" placeholder="Поиск магазина..." @keydown.enter="handleSearch"
                        class="flex-grow" />
                    <FpButton @click="handleSearch">Найти</FpButton>
                </div>
            </FpCard>
        </section>

        <section class="list-section">
            <div v-if="isLoading && stores.length === 0" class="loading">
                <FpSpinner />
            </div>

            <div v-else-if="stores.length === 0" class="empty">
                Ничего не найдено.
            </div>

            <div class="store-grid">
                <div v-for="store in stores" :key="store.id" class="store-item" @click="viewStore(store.id)">
                    <FpCard class="item-card">
                        <div class="item-content">
                            <h3 class="name">{{ store.name }}</h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </FpCard>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped lang="scss">
.stores-list-view {
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

.store-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
}

.item-card {
    transition: background 0.2s;
    cursor: pointer;

    &:active {
        background: var(--color-surface-hover);
    }
}

.item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .name {
        margin: 0;
        font-size: var(--text-body-1);
        font-weight: 500;
    }

    color: var(--color-text-secondary);
}

.loading,
.empty {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-secondary);
}
</style>
