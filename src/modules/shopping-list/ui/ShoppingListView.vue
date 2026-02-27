<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { shoppingListStore } from '../state/shoppingListStore'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { useRouter } from 'vue-router'

import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'
import FpCombobox from '@/design-system/components/FpCombobox.vue'
import { FpSpinner } from '@/design-system'

const router = useRouter()
const newItemText = ref('')
const selectedProduct = ref<any>(null)
const newItemPrice = ref('')
const newItemQuantity = ref('1')

const editingItemId = ref<string | null>(null)
const editPrice = ref<string>('')
const editQuantity = ref<string>('1')

const uncheckedItems = computed(() => shoppingListStore.uncheckedItems.value)
const checkedItems = computed(() => shoppingListStore.checkedItems.value)
const totalExpenses = computed(() => shoppingListStore.totalExpenses.value)
const { isLoading } = shoppingListStore

const searchResults = computed(() => [...catalogStore.searchResults.value])

onMounted(() => {
    shoppingListStore.loadItems()
    // Load initial products/stores for suggestions
    catalogStore.searchProducts('')
})

const onProductFocus = () => {
    if (!newItemText.value) {
        catalogStore.searchProducts('')
    }
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined

const handleSearch = (val: string) => {
    newItemText.value = val
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
        if (val.length > 1) {
            await catalogStore.searchProducts(val)
        }
    }, 300)
}

const onProductSelect = (product: any) => {
    selectedProduct.value = product
    newItemText.value = product.name
}

const addItem = async () => {
    if (!newItemText.value.trim()) return

    try {
        await shoppingListStore.addItem(
            newItemText.value,
            selectedProduct.value?.id,
            {
                price: Number(newItemPrice.value) || undefined,
                quantity: Number(newItemQuantity.value) || undefined,
                unit: selectedProduct.value?.unit
            }
        )

        // Reset
        newItemText.value = ''
        selectedProduct.value = null
        newItemPrice.value = ''
        newItemQuantity.value = '1'
    } catch (e: any) {
        console.error('Failed to add item:', e)
        alert('Не удалось добавить в список: ' + (e.message || 'ошибка базы данных'))
    }
}

const toggleItem = (item: any) => {
    if (!item.isChecked) {
        // Prepare to enter price when checking
        editingItemId.value = item.id
        editPrice.value = item.price ? String(item.price) : ''
        editQuantity.value = item.quantity ? String(item.quantity) : '1'
    } else {
        shoppingListStore.toggleItem(item.id, false)
    }
}

const confirmPurchase = async () => {
    if (editingItemId.value) {
        await shoppingListStore.toggleItem(editingItemId.value, true, {
            price: Number(editPrice.value) || 0,
            quantity: Number(editQuantity.value) || 1
        })
        editingItemId.value = null
    }
}

const removeItem = (id: string) => {
    if (confirm('Удалить из списка?')) {
        shoppingListStore.removeItem(id)
    }
}

const deleteChecked = () => {
    if (confirm('Удалить все купленные товары?')) {
        shoppingListStore.deleteChecked()
    }
}

const formatPrice = (p: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(p)
}
</script>

<template>
    <div class="shopping-list-view">
        <header class="ergo-header">
            <div class="header-inner">
                <button class="nav-btn" @click="router.push('/')">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="header-title">Список покупок</div>
                <div class="header-controls">
                    <div style="width: 40px;"></div>
                </div>
            </div>
        </header>

        <section class="add-section">
            <FpCard>
                <div class="add-form">
                    <div class="row main-row">
                        <FpCombobox v-model="newItemText" label="Что купить?" :items="searchResults"
                            :loading="catalogStore.isSearching.value" placeholder="Молоко..."
                            @update:modelValue="handleSearch" @select="onProductSelect" class="flex-grow" />
                    </div>
                    <div class="row details-row">
                        <FpInput v-model="newItemPrice" type="number" label="Цена" placeholder="0" size="sm" />
                        <FpInput v-model="newItemQuantity" type="number" label="Кол-во" placeholder="1" size="sm" />
                        <FpButton @click="addItem" :disabled="!newItemText.trim()" variant="primary">Добавить</FpButton>
                    </div>
                </div>
            </FpCard>
        </section>

        <!-- Summary Bar -->
        <section v-if="checkedItems.length > 0" class="summary-bar">
            <FpCard class="summary-card">
                <div class="summary-info">
                    <span class="label">Итого куплено:</span>
                    <span class="value">{{ formatPrice(totalExpenses) }}</span>
                </div>
                <div class="summary-stats">
                    <span>{{ checkedItems.length }} из {{ uncheckedItems.length + checkedItems.length }} товаров</span>
                </div>
            </FpCard>
        </section>

        <section class="list-section">
            <div v-if="isLoading" class="loading">
                <FpSpinner />
            </div>

            <div v-else-if="uncheckedItems.length === 0 && checkedItems.length === 0" class="empty-state">
                Ваш список пуст.
            </div>

            <div v-else class="list-container">
                <!-- Unchecked Items -->
                <div class="items-group">
                    <div v-for="item in uncheckedItems" :key="item.id" class="item-wrapper">
                        <div class="list-item" :class="{ editing: editingItemId === item.id }">
                            <label class="checkbox-label">
                                <input type="checkbox" :checked="item.isChecked" @change="toggleItem(item)" />
                                <span class="custom-checkbox"></span>
                                <span class="item-text">{{ item.text }}</span>
                            </label>
                            <button class="delete-btn" @click="removeItem(item.id)">×</button>
                        </div>

                        <!-- Quick Price/Qty Edit when checking -->
                        <div v-if="editingItemId === item.id" class="edit-overlay">
                            <div class="edit-fields">
                                <FpInput v-model="editPrice" type="number" placeholder="Цена" size="sm" />
                                <FpInput v-model="editQuantity" type="number" placeholder="Кол-во" size="sm" />
                                <FpButton size="sm" @click="confirmPurchase">Ок</FpButton>
                                <FpButton size="sm" variant="secondary" @click="editingItemId = null">Отмена</FpButton>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Checked Items -->
                <div v-if="checkedItems.length > 0" class="checked-group">
                    <div class="group-header">
                        <h3>Куплено ({{ checkedItems.length }})</h3>
                        <button class="clear-btn" @click="deleteChecked">Очистить</button>
                    </div>
                    <div v-for="item in checkedItems" :key="item.id" class="list-item checked">
                        <label class="checkbox-label">
                            <input type="checkbox" :checked="item.isChecked" @change="toggleItem(item)" />
                            <span class="custom-checkbox"></span>
                            <div class="item-info">
                                <span class="item-text">{{ item.text }}</span>
                                <span class="item-subtext" v-if="item.price">
                                    {{ item.quantity }} x {{ formatPrice(item.price as number) }} = {{
                                        formatPrice((item.price as number) * (item.quantity as number || 1)) }}
                                </span>
                            </div>
                        </label>
                        <button class="delete-btn" @click="removeItem(item.id)">×</button>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped lang="scss">
.shopping-list-view {
    padding: 0 0.5rem;
    max-width: var(--layout-max-width);

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

.add-section {
    margin-bottom: var(--spacing-md);
}

.add-form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .row {
        display: flex;
        gap: 8px;
        align-items: flex-end;
    }

    .flex-grow {
        flex: 1;
    }

    .details-row {
        justify-content: space-between;

        :deep(.fp-input-wrapper),
        :deep(.fp-input-group) {
            margin-bottom: 0;
        }
    }
}

.input-row {
    display: flex;
    gap: 8px;

    .flex-grow {
        flex: 1;
    }
}

.summary-bar {
    margin-top: var(--spacing-md);
}

.summary-card {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-variant));
    color: white;
    padding: var(--spacing-md);

    .summary-info {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 4px;

        .label {
            font-size: var(--text-caption);
            opacity: 0.9;
        }

        .value {
            font-size: var(--text-h5);
            font-weight: 800;
        }
    }

    .summary-stats {
        font-size: var(--text-caption);
        opacity: 0.8;
    }
}

.list-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.item-wrapper {
    position: relative;
    margin-bottom: 8px;
}

.list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: all 0.2s;

    &:hover {
        border-color: var(--color-primary);
    }

    &.editing {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(108, 93, 211, 0.1);
    }

    &.checked {
        opacity: 0.7;
        background: var(--color-background);

        .item-text {
            text-decoration: line-through;
            color: var(--color-text-secondary);
        }
    }
}

.edit-overlay {
    margin-top: 4px;
    padding: 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-2);
    z-index: 10;

    .edit-fields {
        display: flex;
        gap: 8px;
        align-items: center;
    }
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    flex: 1;

    input {
        display: none;
    }

    .custom-checkbox {
        width: 24px;
        height: 24px;
        border: 2px solid var(--color-primary);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &::after {
            content: '✓';
            color: white;
            opacity: 0;
            transition: 0.2s;
        }
    }

    input:checked+.custom-checkbox {
        background: var(--color-primary);

        &::after {
            opacity: 1;
        }
    }
}

.item-info {
    display: flex;
    flex-direction: column;
}

.item-subtext {
    font-size: var(--text-caption);
    color: var(--color-primary);
    font-weight: 600;
}

.delete-btn {
    background: none;
    border: none;
    color: var(--color-text-disabled);
    font-size: 20px;
    cursor: pointer;

    &:hover {
        color: var(--color-error);
    }
}

.checked-group {
    .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        h3 {
            font-size: var(--text-caption);
            text-transform: uppercase;
            color: var(--color-text-secondary);
        }
    }
}

.clear-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: var(--text-caption);
    cursor: pointer;
}

.empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--color-text-secondary);
}

.loading {
    text-align: center;
    padding: 2rem;
}
</style>
