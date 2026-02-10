<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
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

const confirmDeleteProduct = async () => {
    if (confirm('Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.')) {
        if (currentProduct.value) {
            await catalogStore.deleteProduct(currentProduct.value.id)
            router.push('/')
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

const goToAddPrice = () => {
    if (currentProduct.value) {
        router.push('/add-price')
    }
}
</script>

<template>
    <div class="product-view">
        <header class="page-header">
            <FpButton variant="text" size="sm" @click="router.back()">← Назад</FpButton>
            <h1>Товар</h1>
        </header>

        <div v-if="currentProduct">
            <FpCard class="main-card">
                <!-- Product Header / Edit Mode -->
                <div class="product-header">
                    <div v-if="!isEditingProduct" class="header-content">
                        <h2>{{ currentProduct.name }}</h2>
                        <span class="category-badge">{{ currentProduct.category }}</span>
                        <div class="header-actions">
                            <button class="icon-btn edit-btn" @click="startEditProduct"
                                title="Редактировать">✏️</button>
                            <button class="icon-btn delete-btn" @click="confirmDeleteProduct"
                                title="Удалить">🗑️</button>
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
                    <p v-if="currentProduct.storeName">📍 {{ currentProduct.storeName }}</p>
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
                    <div v-for="(item, idx) in latestHistory" :key="idx" class="history-item">
                        <div class="history-header">
                            <!-- Store Name Display / Edit -->
                            <div v-if="editingStoreId !== item.storeId" class="store-display">
                                <span class="store-name">{{ item.storeName }}</span>
                                <button class="icon-btn-small" @click="startEditStore(item.storeId, item.storeName)"
                                    title="Исправить название магазина">✏️</button>
                            </div>
                            <div v-else class="store-edit">
                                <input v-model="storeForm.name" class="edit-input-small"
                                    @keyup.enter="saveStore(item.storeId)" />
                                <button class="icon-btn-small save" @click="saveStore(item.storeId)">💾</button>
                                <button class="icon-btn-small cancel" @click="cancelEditStore">❌</button>
                            </div>

                            <span class="item-date">{{ item.dateRelative }}</span>
                        </div>
                        <div class="price-info">
                            <strong class="item-price">{{ item.price.toLocaleString() }} ₽</strong>
                            <span class="item-unit">за {{ item.unit }}</span>
                        </div>
                        <div class="author-info">
                            👤 {{ item.author }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="loading">
            Загрузка...
        </div>
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

.delete-btn:hover {
    background: rgba(var(--color-error), 0.1);
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
</style>
