<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpBackButton from '@/design-system/components/FpBackButton.vue'
import FpConfirmationModal from '@/design-system/components/FpConfirmationModal.vue'
import FpBreadcrumbs from '@/design-system/components/FpBreadcrumbs.vue'
import { catalogStore } from '@/modules/catalog/store/catalogStore'

const route = useRoute()
const router = useRouter()
const { currentProduct } = catalogStore

// Product Editing State
const isEditingProduct = ref(false)
const productForm = ref({ name: '', category: '' })

// Store Editing State
const editingStoreId = ref<string | null>(null)
const storeForm = ref({ name: '' })

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

const groupedHistory = computed(() => {
    const history = latestHistory.value
    type HistoryItem = typeof history[number]
    const groups = new Map<string, { storeId: string, storeName: string, items: HistoryItem[] }>()

    history.forEach(item => {
        if (!groups.has(item.storeId)) {
            groups.set(item.storeId, {
                storeId: item.storeId,
                storeName: item.storeName,
                items: []
            })
        }
        groups.get(item.storeId)!.items.push(item)
    })

    return Array.from(groups.values())
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
// --- Store Actions ---

const startEditStore = (storeId: string, currentName: string) => {
    editingStoreId.value = storeId
    storeForm.value.name = currentName
}

const cancelEditStore = () => {
    editingStoreId.value = null
}

const saveStore = async (storeId: string) => {
    await catalogStore.updateStoreName(storeId, storeForm.value.name)
    editingStoreId.value = null
}

const deletePrice = async (priceId: string) => {
    if (confirm('Удалить эту цену?')) {
        try {
            await catalogStore.deletePrice(priceId)
        } catch (e: any) {
            alert(`Ошибка при удалении цены: ${e.message || e}`)
        }
    }
}

const goToAddPrice = () => {
    if (currentProduct.value) {
        router.push(`/add-price/${currentProduct.value.id}`)
    }
}

import { AuthService } from '@/modules/auth/services/AuthService'
const currentUserId = ref<string | null>(null)

onMounted(async () => {
    const { user } = await AuthService.getUser()
    currentUserId.value = user?.id || null
})

const canDelete = computed(() => {
    if (!currentProduct.value || !currentUserId.value) return false
    return currentProduct.value.created_by === currentUserId.value || !currentProduct.value.created_by

})

const isFavorite = computed(() => {
    if (!currentProduct.value) return false
    return catalogStore.isFavorite(currentProduct.value.id)
})

const toggleFavorite = async () => {
    if (currentProduct.value) {
        await catalogStore.toggleFavorite(currentProduct.value.id)
    }
}
</script>

<template>
    <div class="product-view">

        <!-- HEADER: standardized 3-column layout -->
        <div class="page-header">
            <FpBackButton />

            <!-- Title in center, unrelated context in breadcrumbs below? or separate -->
            <div class="header-title">
                <h1>{{ currentProduct?.name || 'Товар' }}</h1>
            </div>

            <div class="header-actions">
                <button class="icon-btn star-btn" :class="{ active: isFavorite }" @click="toggleFavorite"
                    title="В избранное">
                    <span v-if="isFavorite">★</span>
                    <span v-else>☆</span>
                </button>
            </div>
        </div>

        <FpBreadcrumbs :items="[
            { label: 'Главная', to: '/' },
            { label: currentProduct?.category || 'Категория', to: currentProduct ? `/category/${currentProduct.category}` : undefined },
            { label: currentProduct?.name || 'Товар' }
        ]" class="breadcrumbs-container" />

        <div v-if="currentProduct">
            <FpCard class="main-card">
                <!-- Product Header / Edit Mode -->
                <div class="product-header">
                    <div v-if="!isEditingProduct" class="header-content">
                        <div class="product-title-row">
                            <!-- Title moved to top header, keeping just category here or removing title duplication -->
                            <div class="badges">
                                <span class="category-badge"
                                    @click="router.push(`/category/${currentProduct.category}`)">
                                    📂 {{ currentProduct.category }}
                                </span>
                            </div>
                        </div>
                        <div class="header-actions">
                            <button class="icon-btn edit-btn" @click="startEditProduct"
                                title="Редактировать">✏️</button>
                            <button v-if="canDelete" class="icon-btn delete-btn" @click="confirmDeleteProduct"
                                title="Удалить">🗑️</button>
                            <span v-else title="Вы не можете удалить чужой товар" class="icon-btn disabled">🚫</span>
                        </div>
                    </div>
                    <div v-else class="edit-form">
                        <input v-model="productForm.name" class="edit-input" placeholder="Название товара" />
                        <input v-model="productForm.category" class="edit-input" placeholder="Категория" />
                        <div class="edit-actions">
                            <FpButton size="sm" @click="saveProduct">Сохранить</FpButton>
                            <FpButton size="sm" variant="text" @click="cancelEditProduct">Отмена</FpButton>
                        </div>
                    </div>
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
                    <p v-if="currentProduct.lastStore">📍 {{ currentProduct.lastStore }}</p>
                </div>

                <div class="actions">
                    <FpButton size="full" @click="goToAddPrice">
                        Добавить новую цену
                    </FpButton>
                </div>
            </FpCard>

            <div class="history-section">
                <h3>История цен</h3>
                <div v-if="latestHistory.length === 0" class="empty-state">
                    История цен пуста
                </div>
                <div v-else class="history-list">
                    <div v-for="group in groupedHistory" :key="group.storeId" class="history-group">
                        <div class="group-header">
                            <div v-if="editingStoreId !== group.storeId" class="store-display">
                                <span class="store-name clickable" @click="router.push(`/store/${group.storeId}`)">
                                    {{ group.storeName }}
                                </span>
                                <button class="icon-btn-small"
                                    @click="startEditStore(group.storeId, group.storeName)">✏️</button>
                            </div>
                            <div v-else class="store-edit">
                                <input v-model="storeForm.name" class="edit-input-small"
                                    @keyup.enter="saveStore(group.storeId)" />
                                <button class="icon-btn-small save" @click="saveStore(group.storeId)">💾</button>
                                <button class="icon-btn-small cancel" @click="cancelEditStore">❌</button>
                            </div>
                        </div>

                        <div class="group-items">
                            <div v-for="(item, idx) in group.items" :key="idx" class="history-item">
                                <div class="item-main">
                                    <strong class="item-price">{{ item.price.toLocaleString() }} ₽</strong>
                                    <span class="item-unit">/ {{ item.unit }}</span>
                                </div>
                                <div class="item-meta">
                                    <span class="item-date">{{ item.dateRelative }}</span>
                                    <span class="item-author">👤 {{ item.author }}</span>
                                    <button v-if="item.id" class="icon-btn-small delete-price"
                                        @click="deletePrice(item.id!)" title="Удалить цену">❌</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="loading">
            Загрузка...
        </div>

        <FpConfirmationModal :visible="showDeleteModal" title="Удаление товара"
            message="Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить." confirm-text="Удалить"
            variant="danger" @update:visible="showDeleteModal = $event" @confirm="handleDeleteConfirm" />
    </div>
</template>

<style scoped lang="scss">
// ... existing styles ...

.header-content {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
}

.header-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
}

.icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
        background: var(--color-surface-hover);
    }
}

.star-btn {
    font-size: 24px;
    color: var(--color-text-secondary);

    &.active {
        color: var(--color-warning); // Gold/Yellow
    }

    &:hover {
        color: var(--color-warning);
        opacity: 0.8;
    }
}

.delete-btn:hover {
    background: rgba(var(--color-error), 0.1);
}

.disabled {
    cursor: not-allowed;
    opacity: 0.3;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.edit-input {
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--text-h4);
    font-family: inherit;
    width: 100%;
}

.page-header {
    display: grid;
    grid-template-columns: 48px 1fr 48px;
    align-items: center;
    margin-bottom: var(--spacing-sm);
}

.header-title h1 {
    margin: 0;
    font-size: 24px;
    text-align: center;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.breadcrumbs-container {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-md);
}


.product-header {
    margin-bottom: 24px;
}

.product-title-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.badges {
    display: flex;
    gap: 8px;
}

.category-badge {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    font-size: var(--text-caption);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: var(--color-surface-hover);
        color: var(--color-primary);
        border-color: var(--color-primary);
    }
}

.edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.store-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.store-edit {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-grow: 1;
}

.icon-btn-small {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.5;
    transition: opacity 0.2s;
    padding: 2px;

    &:hover {
        opacity: 1;
    }
}

.edit-input-small {
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--text-body-1);
    width: auto;
    min-width: 150px;
}

.history-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.history-group {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.group-header {
    background: var(--color-background);
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.group-items {
    padding: 0;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border);

    &:last-child {
        border-bottom: none;
    }
}

.item-main {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.item-price {
    font-size: var(--text-body-1);
    font-weight: 700;
    color: var(--color-text-primary);
}

.store-name {
    font-weight: 600;
    color: var(--color-text-primary);
    cursor: pointer;

    &:hover {
        color: var(--color-primary);
        text-decoration: underline;
    }
}

.item-unit {
    font-size: var(--text-caption);
    color: var(--color-text-secondary);
}

.item-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: var(--text-caption);
    color: var(--color-text-tertiary);
    gap: 2px;
}
</style>
