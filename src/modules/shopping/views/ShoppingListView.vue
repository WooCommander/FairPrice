<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { shoppingListStore } from '@/modules/shopping-list/store/shoppingListStore'

import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'
import { FpSpinner } from '@/design-system'

const newItemText = ref('')

const uncheckedItems = computed(() => shoppingListStore.uncheckedItems.value)
const checkedItems = computed(() => shoppingListStore.checkedItems.value)
const { isLoading } = shoppingListStore

onMounted(() => {
    shoppingListStore.loadItems()
})

const addItem = async () => {
    if (!newItemText.value.trim()) return
    await shoppingListStore.addItem(newItemText.value)
    newItemText.value = ''
}

const toggleItem = (item: any) => {
    shoppingListStore.toggleItem(item.id, !item.is_checked)
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
</script>

<template>
    <div class="shopping-list-view">
        <header class="ergo-header">
            <div class="header-inner">
                <button class="nav-btn" @click="$router.push('/')">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="header-title">
                    Список покупок
                </div>
                <div class="header-controls">
                    <div style="width: 40px;"></div> <!-- Spacer -->
                </div>
            </div>
        </header>

        <section class="add-section">
            <FpCard>
                <div class="input-row">
                    <FpInput v-model="newItemText" placeholder="Добавить товар (например, Хлеб)"
                        @keydown.enter="addItem" class="flex-grow" />
                    <FpButton @click="addItem" :disabled="!newItemText.trim()">+</FpButton>
                </div>
            </FpCard>
        </section>

        <section class="list-section">
            <div v-if="isLoading" class="loading">
                <FpSpinner />
            </div>

            <div v-else-if="uncheckedItems.length === 0 && checkedItems.length === 0" class="empty-state">
                Ваш список пуст. Добавьте что-нибудь!
            </div>

            <div v-else class="list-container">
                <!-- Unchecked Items -->
                <div class="items-group">
                    <div v-for="item in uncheckedItems" :key="item.id" class="list-item">
                        <label class="checkbox-label">
                            <input type="checkbox" :checked="item.is_checked" @change="toggleItem(item)" />
                            <span class="custom-checkbox"></span>
                            <span class="item-text">{{ item.text }}</span>
                        </label>
                        <button class="delete-btn" @click="removeItem(item.id)">×</button>
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
                            <input type="checkbox" :checked="item.is_checked" @change="toggleItem(item)" />
                            <span class="custom-checkbox"></span>
                            <span class="item-text">{{ item.text }}</span>
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
    // margin: 0 auto;
}

.ergo-header {
    background: var(--color-surface);
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--color-border);
    margin: 0 -0.5rem var(--spacing-md) -0.5rem;
    padding: 12px 16px;
}

.header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.header-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    text-align: center;
}

.nav-btn {
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:active {
        background: var(--color-surface-hover);
        color: var(--color-text-primary);
    }
}

.input-row {
    display: flex;
    gap: 8px;
    align-items: center;

    .flex-grow {
        flex: 1;
    }
}

.list-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
}

.list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);

    &:last-child {
        border-bottom: none;
    }

    &.checked {
        .item-text {
            text-decoration: line-through;
            color: var(--color-text-secondary);
        }
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
        transition: all 0.2s;
        flex-shrink: 0;

        &::after {
            content: '✓';
            color: white;
            font-size: 16px;
            opacity: 0;
            transform: scale(0.5);
            transition: all 0.2s;
        }
    }

    input:checked+.custom-checkbox {
        background: var(--color-primary);

        &::after {
            opacity: 1;
            transform: scale(1);
        }
    }

    .item-text {
        font-size: var(--text-body-1);
        word-break: break-word;
    }
}

.delete-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0 8px;
    opacity: 0.5;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
        color: var(--color-error);
    }
}

.checked-group {
    opacity: 0.8;
    margin-top: 16px;
    background: rgba(var(--color-surface-rgb), 0.5);
    border-radius: var(--radius-md);

    .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        h3 {
            font-size: var(--text-body-2);
            color: var(--color-text-secondary);
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    }
}

.clear-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: var(--text-caption);
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
    font-style: italic;
}

.loading {
    text-align: center;
    padding: 20px;
    color: var(--color-text-secondary);
}
</style>
