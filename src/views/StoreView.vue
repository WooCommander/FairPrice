<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'

const route = useRoute()
const router = useRouter()
const storeId = route.params.id as string
const storeName = ref('Магазин')
const isLoading = ref(true)

/*
    We reuse searchResults from catalogStore to display the list, 
    since it's just a list of products.
*/
const { searchResults } = catalogStore

onMounted(async () => {
    isLoading.value = true
    try {
        storeName.value = await catalogStore.getStoreName(storeId)
        await catalogStore.loadProductsByStore(storeId)
    } finally {
        isLoading.value = false
    }
})

const goToAddPrice = () => {
    router.push({
        path: '/add-price',
        query: { storeId: storeId }
    })
}

// Editing Logic
const isEditing = ref(false)
const editName = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

const startEdit = () => {
    editName.value = storeName.value
    isEditing.value = true
    // Wait for DOM update to focus
    setTimeout(() => {
        editInputRef.value?.focus()
    }, 50)
}

const cancelEdit = () => {
    isEditing.value = false
}

const saveEdit = async () => {
    if (!editName.value.trim() || editName.value === storeName.value) {
        isEditing.value = false
        return
    }

    try {
        await catalogStore.updateStoreName(storeId, editName.value)
        storeName.value = editName.value
        isEditing.value = false
    } catch (e) {
        console.error('Failed to update store name', e)
        alert('Не удалось обновить название магазина')
    }
}
</script>

<template>
    <div class="store-view">
        <header class="page-header">
            <FpButton variant="text" size="sm" @click="router.back()">← Назад</FpButton>

            <div v-if="!isEditing" class="title-row">
                <h1>{{ storeName }}</h1>
                <button class="icon-btn" @click="startEdit" title="Редактировать название">✏️</button>
            </div>
            <div v-else class="edit-row">
                <input v-model="editName" class="edit-input" @keyup.enter="saveEdit" ref="editInputRef" />
                <div class="edit-actions">
                    <button class="icon-btn save" @click="saveEdit" title="Сохранить">💾</button>
                    <button class="icon-btn cancel" @click="cancelEdit" title="Отмена">❌</button>
                </div>
            </div>

            <p class="subtitle">Товары в этой точке</p>
            <div class="header-actions">
                <FpButton class="add-btn" size="sm" @click="goToAddPrice">
                    + Добавить цену
                </FpButton>
            </div>
        </header>

        <div v-if="isLoading" class="loading">Загрузка...</div>

        <div v-else-if="searchResults.length === 0" class="empty-state">
            <p>Здесь пока нет товаров с ценами.</p>
            <FpButton @click="goToAddPrice">Добавить цену</FpButton>
        </div>

        <div v-else class="products-grid">
            <FpCard v-for="product in searchResults" :key="product.id" class="product-card"
                @click="router.push(`/product/${product.id}`)">
                <div class="product-info">
                    <h3>{{ product.name }}</h3>
                    <span class="category">{{ product.category }}</span>
                </div>
                <div class="price-info">
                    <span class="price">{{ product.formattedPrice }}</span>
                    <span class="date">{{ product.lastUpdateRelative }}</span>
                </div>
            </FpCard>
        </div>
    </div>
</template>

<style scoped lang="scss">
.store-view {
    max-width: 800px;
    margin: 0 auto;
}

.page-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);

    h1 {
        margin: var(--spacing-sm) 0 4px;
        font-size: var(--text-h3);
    }

    .title-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    .edit-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        margin: var(--spacing-sm) 0;
    }

    .edit-input {
        font-size: var(--text-h3);
        text-align: center;
        padding: 4px 8px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        max-width: 100%;
        width: 300px;
    }

    .edit-actions {
        display: flex;
        gap: 8px;
    }

    .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        font-size: 1.2rem;
        opacity: 0.5;
        transition: opacity 0.2s;

        &:hover {
            opacity: 1;
        }

        &.save {
            color: var(--color-success);
            opacity: 1;
        }

        &.cancel {
            color: var(--color-error);
            opacity: 1;
        }
    }

    .subtitle {
        color: var(--color-text-secondary);
        margin: 0;
    }
}

.products-grid {
    display: grid;
    gap: var(--spacing-md);
}

.product-card {
    display: flex !important; // Override card default if needed
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
    }
}

.product-info h3 {
    margin: 0;
    font-size: var(--text-body-1);
    font-weight: 600;
}

.category {
    font-size: var(--text-caption);
    color: var(--color-text-secondary);
}

.price-info {
    text-align: right;
    display: flex;
    flex-direction: column;
}

.price {
    font-weight: 700;
    color: var(--color-primary);
}

.date {
    font-size: var(--text-caption);
    color: var(--color-text-tertiary);
}

.empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
}
</style>
