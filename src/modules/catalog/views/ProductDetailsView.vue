<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CatalogService, type Product } from '../services/CatalogService'
import { AnalyticsService, type PricePoint, type CheapPlace } from '@/modules/analytics/services/AnalyticsService'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'
import PriceHistoryChart from '@/modules/analytics/components/PriceHistoryChart.vue'
import CheapPlacesList from '@/modules/analytics/components/CheapPlacesList.vue'

const route = useRoute()
const router = useRouter()
const product = ref<Product | null>(null)
const loading = ref(true)
const priceHistory = ref<PricePoint[]>([])
const cheapPlaces = ref<CheapPlace[]>([])

onMounted(async () => {
    const id = String(route.params.id)
    loading.value = true
    try {
        const found = await CatalogService.getProductById(id)
        if (found) {
            product.value = found
            // Load analytics in parallel
            const [history, places] = await Promise.all([
                AnalyticsService.getPriceHistory(id),
                AnalyticsService.getBestPlaces(id)
            ])
            priceHistory.value = history
            cheapPlaces.value = places
        }
    } finally {
        loading.value = false
    }
})

const goBack = () => router.back()
const goToAddPrice = () => {
    if (product.value) {
        router.push(`/add-price/${product.value.id}`)
    }
}
</script>

<template>
    <div class="product-details">
        <header class="top-nav">
            <FpButton variant="text" size="sm" @click="goBack">← Back</FpButton>
        </header>

        <div v-if="loading" class="loading">Loading...</div>

        <div v-else-if="product" class="content">
            <h2 class="title">{{ product.name }}</h2>
            <span class="badge">{{ product.category }}</span>

            <div class="actions">
                <FpButton variant="primary" size="full" @click="goToAddPrice">
                    + Add Price Report
                </FpButton>
            </div>

            <section class="analytics-section">
                <h3>Price Dynamics (7 days)</h3>
                <FpCard class="chart-card">
                    <PriceHistoryChart :data="priceHistory" />
                </FpCard>
            </section>

            <section class="analytics-section">
                <h3>Best Deals</h3>
                <CheapPlacesList :places="cheapPlaces" />
            </section>
        </div>

        <div v-else class="error">Product not found</div>
    </div>
</template>

<style scoped lang="scss">
.product-details {
    padding: var(--spacing-md);
}

.top-nav {
    margin-bottom: var(--spacing-md);
}

.title {
    font-size: var(--text-h5);
    margin: 0 0 var(--spacing-sm) 0;
}

.badge {
    display: inline-block;
    background: var(--color-background);
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: var(--text-caption);
    margin-bottom: var(--spacing-lg);
}

.actions {
    margin-bottom: var(--spacing-lg);
}

.analytics-section {
    margin-top: var(--spacing-lg);

    h3 {
        font-size: var(--text-h6);
        margin-bottom: var(--spacing-sm);
        color: var(--color-text-secondary);
    }
}

.chart-card {
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
}
</style>
