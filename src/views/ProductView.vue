<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FpButton from '@/design-system/components/FpButton.vue'
import FpConfirmationModal from '@/design-system/components/FpConfirmationModal.vue'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { shoppingListStore } from '@/modules/shopping-list/store/shoppingListStore'

import PriceChart from '@/components/PriceChart.vue'

const route = useRoute()
const router = useRouter()
const { currentProduct } = catalogStore

// Product Editing State
const isEditingProduct = ref(false)
const productForm = ref({ name: '', category: '' })

onMounted(async () => {
    const id = route.params.id as string
    if (id) {
        await catalogStore.loadProductById(id)
    }
})

const latestHistory = computed(() => {
    if (!currentProduct.value?.history) return []
    return currentProduct.value.history
})

// History grouping removed in favor of simple timeline

const chartData = computed(() => {
    if (!latestHistory.value) return []
    // Filter out invalid prices/dates if any
    return latestHistory.value
        .map(h => ({
            date: new Date(h.date),
            price: h.price
        }))
        .filter(d => !isNaN(d.price) && !isNaN(d.date.getTime()))
})

// --- Product Actions ---

const startEditProduct = () => {
    if (currentProduct.value) {
        productForm.value = {
            name: currentProduct.value.name,
            category: currentProduct.value.category
        }
        isEditingProduct.value = true
    }
}

const cancelEditProduct = () => {
    isEditingProduct.value = false
}

const saveProduct = async () => {
    if (currentProduct.value) {
        await catalogStore.updateProduct(currentProduct.value.id, productForm.value)
        isEditingProduct.value = false
    }
}

const showDeleteModal = ref(false)

const confirmDeleteProduct = () => {
    showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
    if (currentProduct.value) {
        try {
            await catalogStore.deleteProduct(currentProduct.value.id)
            router.back() // Return to previous page as requested
        } catch (e: any) {
            console.error('Failed to delete product:', e)
            alert(`Не удалось удалить товар: ${e.message || e}`)
        }
    }
}
// Store editing removed from this view for simplicity

const goToAddPrice = () => {
    if (currentProduct.value) {
        router.push(`/add-price/${currentProduct.value.id}`)
    }
}

const isFavorite = computed(() => {
    if (!currentProduct.value) return false
    return catalogStore.isFavorite(currentProduct.value.id)
})

const toggleFavorite = async () => {
    if (currentProduct.value) {
        await catalogStore.toggleFavorite(currentProduct.value.id)
    }
}

const addToShoppingList = async () => {
    if (currentProduct.value) {
        try {
            await shoppingListStore.addItem(currentProduct.value.name, currentProduct.value.id)
            alert('Добавлено в список покупок!')
        } catch (e) {
            alert('Не удалось добавить в список')
        }
    }
}
</script>

<template>
    <div class="product-view">
        <!-- ERGONOMIC HEADER -->
        <header class="ergo-header">
            <button class="nav-btn" @click="router.back()">←</button>
            <div class="header-content">
                <span class="header-category" v-if="currentProduct">{{ currentProduct.category }}</span>
                <h1 class="header-title">{{ currentProduct?.name || 'Товар' }}</h1>
            </div>
            <div class="header-controls">
                <button class="nav-btn" @click="toggleFavorite">
                    {{ isFavorite ? '★' : '☆' }}
                </button>
                <!-- More Menu Placeholder (could be a real dropdown later) -->
                <button class="nav-btn" @click="startEditProduct">⋮</button>
            </div>
        </header>

        <div v-if="currentProduct" class="content-body">
            <!-- VALUE CARD -->
            <div class="value-card">
                <div class="card-top-info">
                    <span class="store-badge" v-if="latestHistory[0]?.storeName">
                        📍 {{ latestHistory[0].storeName }}
                    </span>
                    <span class="date-badge" v-if="latestHistory[0]?.dateRelative">
                        {{ latestHistory[0].dateRelative }}
                    </span>
                </div>

                <div class="price-hero">
                    <span class="main-price">{{ currentProduct.formattedPrice }}</span>
                    <span class="unit-label" v-if="currentProduct.unit">за {{ currentProduct.unit }}</span>
                </div>

                <div class="value-analysis" v-if="currentProduct.priceStatus !== 'neutral'">
                    <span class="analysis-pill" :class="currentProduct.priceStatus">
                        {{ currentProduct.priceStatus === 'good' ? '🔥 Отличная цена' : '⚠️ Дороговато' }}
                    </span>
                    <span class="avg-ref" v-if="currentProduct.averagePrice">Средняя: ~{{
                        Math.round(currentProduct.averagePrice) }} ₽</span>
                </div>

                <!-- INTEGRATED CHART -->
                <div class="integrated-chart" v-if="chartData.length > 1">
                    <PriceChart :data="chartData" :average-price="currentProduct.averagePrice" :height="100" />
                </div>

                <!-- Primary Action -->
                <div class="primary-action">
                    <FpButton size="md" width="full" @click="goToAddPrice">
                        Обновить цену
                    </FpButton>
                </div>
            </div>

            <!-- SECONDARY ACTIONS -->
            <div class="secondary-actions">
                <FpButton variant="outline" size="sm" @click="addToShoppingList">
                    📝 В список
                </FpButton>
                <FpButton variant="outline" size="sm" @click="router.push(`/category/${currentProduct.category}`)">
                    📂 В категорию
                </FpButton>
            </div>

            <!-- HISTORY LIST (Compact) -->
            <div class="history-section">
                <!-- Chart moved up -->

                <div class="history-cards-list">
                    <div v-for="(item, idx) in latestHistory" :key="idx" class="history-card-item">
                        <div class="h-card-left">
                            <div class="h-price">{{ item.price }} ₽</div>
                            <div class="h-store">{{ item.storeName }}</div>
                        </div>
                        <div class="h-card-right">
                            <div class="h-date">{{ item.dateRelative }}</div>
                            <!-- Optional: Trend arrow or indicator could go here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Edit Modal (Hidden by default, simplistic implementation for now) -->
            <div v-if="isEditingProduct" class="edit-modal-overlay">
                <div class="edit-modal">
                    <h3>Редактировать</h3>
                    <input v-model="productForm.name" class="modal-input" placeholder="Название" />
                    <div class="modal-actions">
                        <FpButton size="sm" @click="saveProduct">Сохранить</FpButton>
                        <FpButton size="sm" variant="text" @click="cancelEditProduct">Отмена</FpButton>
                        <button class="danger-link" @click="confirmDeleteProduct">Удалить товар</button>
                    </div>
                </div>
            </div>

        </div>
        <div v-else class="loading-state">
            Загрузка...
        </div>

        <FpConfirmationModal :visible="showDeleteModal" title="Удаление товара" message="Удалить товар навсегда?"
            confirm-text="Да, удалить" variant="danger" @update:visible="showDeleteModal = $event"
            @confirm="handleDeleteConfirm" />
    </div>
</template>

<style scoped lang="scss">
.product-view {
    padding-bottom: 40px;
}


.ergo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface);
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--color-border);
}

.nav-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--color-text-primary);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;

    &:active {
        background: var(--color-background);
    }
}

.header-content {
    flex: 1;
    text-align: center;
    overflow: hidden;
    padding: 0 8px;
}

.header-category {
    font-size: 10px;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
    letter-spacing: 1px;
    display: block;
}

.header-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--color-text-primary);
}

.header-controls {
    display: flex;
    gap: 0;
}

.content-body {
    padding: 16px;

    @media (max-width: 600px) {
        padding: 0.5rem; // User requested exactly this
    }

    display: flex;
    flex-direction: column;
    gap: 24px;
}

// VALUE CARD
.value-card {
    background: var(--color-surface);
    border-radius: 20px; // Slightly smaller radius
    padding: 20px; // Reduced padding
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--color-border);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.card-top-info {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px; // Tighter
    font-size: 13px;
    color: var(--color-text-secondary);
    align-items: center;
}

.store-badge {
    font-weight: 500;
    color: var(--color-text-primary);
    background: var(--color-background);
    padding: 4px 8px;
    border-radius: 8px;
}

.price-hero {
    margin-bottom: 12px; // Tighter
    display: flex;
    flex-direction: column;
    align-items: center;
}

.main-price {
    font-size: 40px; // Reduced from 48
    font-weight: 800;
    color: var(--color-text-primary);
    line-height: 1;
    letter-spacing: -1px;
}

.unit-label {
    font-size: 13px;
    color: var(--color-text-tertiary);
    margin-top: 2px;
}

.value-analysis {
    display: flex;
    align-items: center; // Horizontal alignment if possible, or tight vertical
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px; // Tighter
    flex-wrap: wrap;
}

.analysis-pill {
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;

    &.good {
        background: rgba(var(--color-success-rgb), 0.1);
        color: var(--color-success);
    }

    &.bad {
        background: rgba(var(--color-error-rgb), 0.1);
        color: var(--color-error);
    }
}

.badge-bad {
    color: var(--color-error);
    background: rgba(var(--color-error-rgb), 0.1);
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
}

.avg-ref {
    font-size: 12px;
    color: var(--color-text-tertiary);
}

// SECONDARY ACTIONS
.secondary-actions {
    display: flex;
    gap: 8px; // Reduced gap
    justify-content: center; // Center on screen
    flex-wrap: wrap;
}

// HISTORY - COMPACT STYLE
.integrated-chart {
    width: 100%;
    margin: 8px 0 16px 0;
    /* Negative margin to pull it closer if needed */
}

.history-cards-list {
    display: flex;
    flex-direction: column;
    gap: 8px; // Reduced gap
    margin-top: 16px; // Space from secondary actions
}

.history-card-item {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px; // Smaller radius
    padding: 8px 12px; // Compact padding
    display: flex;
    justify-content: space-between;
    align-items: center;
    // Removed shadow for flatter, less "heavy" look
    transition: transform 0.1s;

    &:active {
        transform: scale(0.99);
        background: var(--color-surface-hover);
    }
}

.h-card-left {
    display: flex;
    flex-direction: column;
    gap: 0; // Tighter
}

.h-price {
    font-size: 16px; // Smaller price
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.2;
}

.h-store {
    font-size: 12px; // Smaller store
    color: var(--color-text-secondary);
    font-weight: 400;
}

.h-card-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.h-date {
    font-size: 11px; // Smaller date
    color: var(--color-text-tertiary);
}
</style>
