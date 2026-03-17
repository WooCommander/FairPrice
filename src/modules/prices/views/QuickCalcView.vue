<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Trash2 } from 'lucide-vue-next'
import FpButton from '@/design-system/components/FpButton.vue'
import FpNumberInput from '@/design-system/components/FpNumberInput.vue'

const router = useRouter()

// Standardize header pattern
// Using standard ergo-header

interface CalcItem {
    id: string
    price: number
    amount: number // weight or volume
    unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs' // Simplified for now to just show logic
    unitPrice: number // Price per 1 unit (1 kg/l or 1 pc)
}

// ... imports

const STORAGE_KEY = 'fp-quick-calc-items'

const price = ref(0)
const amount = ref(0)
const unit = ref<'g' | 'kg'>('g')

const items = ref<CalcItem[]>([])

// Load from storage on mount
const loadItems = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            items.value = JSON.parse(stored)
        }
    } catch (e) {
        console.error('Failed to load calc items', e)
    }
}

// Save to storage helper
const saveItems = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

loadItems()

const calculate = () => {
    const p = price.value
    const a = amount.value

    if (!p || !a) return

    let normalizedAmount = a
    let normalizedPrice = 0

    // Logic: Convert everything to Price per 1 KG
    if (unit.value === 'g') {
        normalizedAmount = a / 1000
    }

    if (normalizedAmount > 0) {
        normalizedPrice = p / normalizedAmount
    }

    const newItem: CalcItem = {
        id: Date.now().toString(),
        price: p,
        amount: a,
        unit: unit.value as any,
        unitPrice: normalizedPrice
    }

    items.value.unshift(newItem)
    saveItems()

    price.value = 0
    amount.value = 0
}

const removeItem = (id: string) => {
    items.value = items.value.filter(i => i.id !== id)
    saveItems()
}

const clearAll = () => {
    items.value = []
    saveItems()
}

// Helper to format currency
const formatPrice = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 2
    }).format(val)
}
</script>

<template>
    <div class="quick-calc-view">
        <header class="ergo-header">
            <div class="header-inner">
                <button class="nav-btn" @click="router.back()">
                    <ArrowLeft :size="24" />
                </button>
                <div class="header-title">
                    Калькулятор выгоды
                </div>
                <div class="header-controls">
                    <button class="nav-btn" @click="clearAll" v-if="items.length > 0" title="Очистить всё">
                        <Trash2 :size="20" />
                    </button>
                    <div v-else style="width: 40px;"></div>
                </div>
            </div>
        </header>

        <section class="calc-input-section">
            <div class="input-row">
                <div class="field-group">
                    <FpNumberInput v-model="price" label="Цена (₽)" :min="0" :step="1" />
                </div>
                <div class="field-group">
                    <div class="amount-group" @keydown.enter="calculate">
                        <FpNumberInput v-model="amount" :label="`Вес (${unit})`" :min="0" :step="unit === 'g' ? 50 : 0.1" />
                        <button class="unit-toggle" @click="unit = unit === 'g' ? 'kg' : 'g'">
                            {{ unit }}
                        </button>
                    </div>
                </div>
            </div>
            <FpButton @click="calculate" :disabled="!price || !amount" class="calc-btn">
                Посчитать
            </FpButton>
        </section>

        <section class="results-section">
            <transition-group name="list">
                <div v-for="item in items" :key="item.id" class="result-card">
                    <div class="result-main">
                        <div class="result-price-per-kg">
                            {{ formatPrice(item.unitPrice) }} / кг
                        </div>
                        <div class="result-details">
                            {{ item.amount }}{{ item.unit }} за {{ item.price }}₽
                        </div>
                    </div>
                    <button class="remove-btn" @click="removeItem(item.id)">×</button>
                </div>
            </transition-group>

            <div v-if="items.length === 0" class="empty-hint">
                Вводите цену и вес, чтобы сравнить стоимость за килограмм
            </div>
        </section>
    </div>
</template>

<style scoped lang="scss">
.quick-calc-view {
    padding: 0 0.5rem;
    min-height: 100vh;
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

    &:active {
        background: var(--color-surface-hover);
        color: var(--color-text-primary);
    }
}

.calc-input-section {
    background: var(--color-surface);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    margin-bottom: var(--spacing-lg);
}

.input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;

    .field-group {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;

        label {
            font-size: var(--text-caption);
            color: var(--color-text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}

.amount-group {
    display: flex;
    align-items: flex-end;
    gap: 6px;

    :deep(.fp-number-input) {
        flex: 1;
        min-width: 0;
    }

    .unit-toggle {
        background: var(--color-background);
        border: 1px solid var(--color-border);
        color: var(--color-text-primary);
        padding: 0 4px;
        height: 40px; // Match input height
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        min-width: 36px;
        flex-shrink: 0;

        &:active {
            background: var(--color-border);
        }
    }
}

.calc-btn {
    width: 100%;
}

.results-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.result-card {
    background: var(--color-surface);
    padding: 12px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-sm);
}

.result-price-per-kg {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary);
}

.result-details {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
}

.remove-btn {
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0 8px;

    &:hover {
        color: var(--color-error);
    }
}

.empty-hint {
    text-align: center;
    color: var(--color-text-tertiary);
    margin-top: 20px;
    font-style: italic;
}

.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
