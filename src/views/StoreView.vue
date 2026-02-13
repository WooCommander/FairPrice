<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpBackButton from '@/design-system/components/FpBackButton.vue'
import { FpSpinner } from '@/design-system'

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
            <div class="header-top">
                <FpBackButton />
                <div class="header-title-container">
                    <div v-if="!isEditing" class="title-row">
                        <h1>{{ storeName }}</h1>
                        <button class="icon-btn edit-icon" @click="startEdit" title="Редактировать название">✏️</button>
                    </div>
                    <div v-else class="edit-row">
                        <input v-model="editName" class="edit-input" @keyup.enter="saveEdit" ref="editInputRef" />
                        <div class="edit-actions">
                            <button class="icon-btn save" @click="saveEdit" title="Сохранить">💾</button>
                            <button class="icon-btn cancel" @click="cancelEdit" title="Отмена">❌</button>
                        </div>
                    </div>
                </div>
                <div class="header-spacer"></div> <!-- Spacer for visuals balance -->
            </div>

            <p class="subtitle">Товары в этой точке</p>

            <div class="header-actions">
                <FpButton class="add-btn" size="sm" @click="goToAddPrice">
                    + Добавить цену
                </FpButton>
            </div>
        </header>

        <div v-if="isLoading" class="loading">
            <FpSpinner />
        </div>

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
    margin-bottom: var(--spacing-xl); // Increased spacing

    .header-top {
        display: grid;
        grid-template-columns: 48px 1fr 48px; // Fixed width for back btn and spacer
        align-items: center;
        margin-bottom: var(--spacing-sm);
    }

    h1 {
        margin: 0;
        font-size: 28px; // Increased title size
        text-align: center;
        line-height: 1.2;
    }

    .title-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
    }

    .edit-icon {
        font-size: 1rem;
        opacity: 0.3;
    }

    .edit-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
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
        margin: 0 0 var(--spacing-md);
        text-align: center;
        font-size: 14px;
    }

    .header-actions {
        display: flex;
        justify-content: center;
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
    font-size: 18px; // 18px
    font-weight: 600;
}

.category {
    font-size: 14px; // 14px
    color: var(--color-text-secondary);
}

.price-info {
    text-align: right;
    display: flex;
    flex-direction: column;
}

.price {
    font-weight: 700;
    color: var(--color-success); // Ensure success color
    font-size: 18px; // 18px
}

.date {
    font-size: 1rem;
    color: var(--color-text-tertiary);
}

.empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
}
</style>
