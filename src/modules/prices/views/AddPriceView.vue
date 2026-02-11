<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { priceStore } from '../store/priceStore'
import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'
import FpCombobox from '@/design-system/components/FpCombobox.vue'
import FpBreadcrumbs from '@/design-system/components/FpBreadcrumbs.vue'

const route = useRoute()
const router = useRouter()

const step = ref(1) // 1: Select Product, 2: Enter Details
const searchQuery = ref('')
const storeName = ref('')
const price = ref<string | number>('')
const unit = ref('кг')
let debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined
const isStoreSelected = ref(false)

const storeResults = ref<{ id: string, name: string }[]>([])
const isSearchingStores = ref(false)

// Create Product State
const isCreating = ref(false)
const newProductName = ref('')
const newProductCategory = ref('Бакалея')
const newProductUnit = ref('шт')

import { PRODUCT_CATEGORIES } from '@/modules/catalog/constants'
// ... (imports)

// ...

const categories = PRODUCT_CATEGORIES.map(c => ({ id: c, name: c }))

const units = ['шт', 'кг', 'л', 'уп'].map(u => ({ id: u, name: u }))

// Explicitly type as generic string to allow custom categories
const categoryItems = ref<{ id: string, name: string }[]>([...categories])
const unitItems = ref(units)

// Store access
const { searchResults, currentProduct } = catalogStore
const { isSubmitting } = priceStore

// Logic
const quantity = ref<string | number>('')

// Computed Unit Price
const calculatedUnitPrice = computed(() => {
    const p = Number(price.value)
    const q = Number(quantity.value)

    if (!p || !q) return null

    const u = unit.value.toLowerCase()
    let normalized = 0
    let base = ''

    if (u === 'g' || u === 'г' || u === 'ml' || u === 'мл') {
        normalized = p / (q / 1000)
        base = u === 'g' || u === 'г' ? 'кг' : 'л'
    } else {
        normalized = p / q
        base = u
    }

    return {
        price: Math.round(normalized),
        unit: base
    }
})

// Computed
const isValid = computed(() => {
    const priceVal = Number(price.value)
    const storeVal = storeName.value
    // Check if quantity is valid (optional if logic permits, but for fair price we need it)
    // Let's make quantity required for better data, or default to 1 if empty?
    // Better to require it for explicit "Fair Price" data.
    const quantityVal = Number(quantity.value)

    return storeVal.length > 1 && !isNaN(priceVal) && priceVal > 0 && !isNaN(quantityVal) && quantityVal > 0
})

const comboboxSearchResults = computed(() => {
    return Array.from(searchResults.value)
})

// Stores Methods
const handleSearchStore = async (val: string) => {
    storeName.value = val
    if (val.length < 2) {
        // Don't clear if it's empty, might be default list
        if (val.length === 0) return
        storeResults.value = []
        return
    }

    isSearchingStores.value = true
    try {
        storeResults.value = await priceStore.getStores(val)
    } finally {
        isSearchingStores.value = false
    }
}

const selectStore = (item: { id: string | number, name: string }) => {
    storeName.value = item.name
    isStoreSelected.value = true
}

const createStore = (name: string) => {
    storeName.value = name
    storeResults.value = [] // Clear suggestions
    isStoreSelected.value = true
}

const onStoreFocus = async () => {
    // Load defaults/recents if empty
    if (!storeName.value) {
        isSearchingStores.value = true
        try {
            storeResults.value = await priceStore.getStores('')
        } finally {
            isSearchingStores.value = false
        }
    }
}

// Product Methods
const handleSearch = (val: string) => {
    const query = String(val)
    searchQuery.value = query

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
        if (query.length > 1) {
            await catalogStore.searchProducts(query)
        }
    }, 300)
}

const selectProduct = (p: { id: string | number, name: string }) => {
    catalogStore.loadProductById(String(p.id))
    step.value = 2
}

const onProductFocus = async () => {
    if (!searchQuery.value) {
        // Load recent or empty search
        await catalogStore.searchProducts('')
    }
}

const handleProductCreate = (query: string) => {
    startCreation()
    newProductName.value = query
}

const startCreation = () => {
    isCreating.value = true
    newProductName.value = searchQuery.value
}

const cancelCreation = () => {
    isCreating.value = false
    newProductName.value = ''
}

const createProduct = async () => {
    if (!newProductName.value) return

    try {
        await catalogStore.createProduct({
            name: newProductName.value,
            category: newProductCategory.value,
            unit: newProductUnit.value
        })
        isCreating.value = false
        step.value = 2
    } catch (e: any) {
        console.error('Failed to create product:', e)
        alert(`Не удалось создать товар: ${e.message || e}`)
    }
}

// Handlers for new comboboxes
const createCategory = (val: string) => {
    const newItem = { id: val, name: val }
    categoryItems.value.push(newItem)
    newProductCategory.value = val
}

const createUnit = (val: string) => {
    const newItem = { id: val, name: val }
    unitItems.value.push(newItem)
    newProductUnit.value = val
}

const isSuccess = ref(false)

// Exchange Rate Logic


const submit = async () => {
    if (!currentProduct.value) return

    const finalPrice = Number(price.value)
    const finalQuantity = Number(quantity.value)

    try {
        await priceStore.submitPrice({
            productId: currentProduct.value.id,
            storeName: storeName.value,
            price: finalPrice,
            currency: 'RUB',
            quantity: finalQuantity,
            quantityUnit: unit.value
        })
        isSuccess.value = true
        setTimeout(() => {
            if (currentProduct.value) {
                router.push(`/product/${currentProduct.value.id}`)
            }
        }, 1500)
    } catch (e) {
        console.error('Failed to submit price:', e)
        alert('Ошибка при сохранении цены')
    }
}

onMounted(async () => {
    const id = route.params.id as string
    if (id) {
        await catalogStore.loadProductById(id)
        if (currentProduct.value) {
            step.value = 2
            unit.value = currentProduct.value.unit || 'кг'
        }
    } else {
        catalogStore.clearSearch()
    }

    // Pre-fill from Query Params
    if (route.query.storeId) {
        const id = String(route.query.storeId)
        // We can reuse catalogStore or priceStore to get name
        // catalogStore.getStoreName is available
        storeName.value = await catalogStore.getStoreName(id)
        isStoreSelected.value = true
    } else if (route.query.storeName) {
        storeName.value = String(route.query.storeName)
        isStoreSelected.value = true
    }

    if (route.query.category) {
        newProductCategory.value = String(route.query.category)
    }
})
</script>

<template>
    <div class="add-price-view">
        <FpBreadcrumbs :items="[
            { label: 'Главная', to: '/' },
            { label: 'Добавить цену' }
        ]" />
        <header class="page-header">
            <h1>Добавить цену</h1>
        </header>

        <!-- Step 1: Select Product -->
        <section v-if="step === 1" class="step-section">
            <FpCard>
                <div v-if="!isCreating">
                    <h3>Выберите товар</h3>
                    <FpCombobox v-model="searchQuery" label="Поиск товара" placeholder="Например: Молоко"
                        :items="comboboxSearchResults" :loading="catalogStore.isSearching.value" allow-create
                        create-label="Добавить новый товар" @update:modelValue="handleSearch" @select="selectProduct"
                        @create="handleProductCreate" @focus="onProductFocus" />
                </div>

                <div v-else class="creation-form">
                    <h3>Новый товар</h3>
                    <div class="form-grid">
                        <FpInput v-model="newProductName" label="Название" @keydown.enter="createProduct" />

                        <div class="select-group">
                            <FpCombobox v-model="newProductCategory" label="Категория" :items="categoryItems"
                                placeholder="Выберите категорию" allow-create @create="createCategory" />
                        </div>

                        <div class="select-group">
                            <FpCombobox v-model="newProductUnit" label="Ед. изм." :items="unitItems"
                                placeholder="шт, кг..." allow-create @create="createUnit" />
                        </div>
                    </div>

                    <div class="actions-row">
                        <FpButton variant="secondary" @click="cancelCreation">Отмена</FpButton>
                        <FpButton :loading="catalogStore.isSearching.value" @click="createProduct">Создать</FpButton>
                    </div>
                </div>
            </FpCard>
        </section>

        <!-- Step 2: Enter Details -->
        <section v-else class="step-section">
            <FpCard>
                <div class="product-summary" v-if="currentProduct">
                    <h3>{{ currentProduct.name }}</h3>
                    <span class="category">{{ currentProduct.category }}</span>
                    <button class="change-btn" @click="step = 1">Изменить</button>
                </div>

                <div class="form-grid">
                    <div class="store-field">
                        <FpCombobox v-model="storeName" label="Магазин" placeholder="Магазин или рынок"
                            :items="storeResults" :loading="isSearchingStores" allow-create
                            create-label="Добавить место" @update:modelValue="handleSearchStore" @select="selectStore"
                            @create="createStore" @focus="onStoreFocus" />
                    </div>

                    <!-- Price Row -->
                    <div class="price-row">
                        <FpInput v-model="price" label="Цена (₽)" type="number" placeholder="0" class="price-input" />
                    </div>

                    <!-- Quantity Row -->
                    <div class="quantity-row">
                        <FpInput v-model="quantity" label="Вес/Объем" type="number" placeholder="900"
                            class="quantity-input" />
                        <div class="unit-select">
                            <FpCombobox v-model="unit" label="Ед." :items="unitItems" placeholder="г" allow-create
                                @create="createUnit" :clearable="false" />
                        </div>
                    </div>

                    <!-- Calculated Info -->
                    <div class="calc-info" v-if="calculatedUnitPrice">
                        <span class="label">Цена за {{ calculatedUnitPrice.unit }}:</span>
                        <span class="value">~{{ calculatedUnitPrice.price }} ₽</span>
                    </div>
                </div>

                <div class="actions" v-if="!isSuccess">
                    <FpButton :loading="isSubmitting" :disabled="!isValid" size="full" @click="submit">
                        Сохранить
                    </FpButton>
                </div>
                <div v-else class="success-message">
                    ✅ Цена успешно добавлена!
                </div>
            </FpCard>
        </section>
    </div>
</template>

<style scoped lang="scss">
.page-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);

    h1 {
        font-size: var(--text-h3);
        margin: 0;
    }
}

.product-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-md);
    padding-left: 4px;
    /* Fix visual sticking */
    padding-right: 4px;

    h3 {
        margin: 0;
        font-size: var(--text-body-1);
        font-weight: 600;
        /* Improve hierarchy */
    }

    .category {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
        margin-left: 8px;
    }
}

.change-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: var(--text-caption);
    text-decoration: underline;
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    position: relative;
}

.actions-row {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
}

.price-row,
.quantity-row {
    display: flex;
    gap: 12px;
}

.price-input {
    flex: 1;
}

.quantity-input {
    flex: 2;
}

.unit-select {
    flex: 1;
    min-width: 80px;
}

.currency-toggles {
    display: flex;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 4px;
    height: 56px;
    /* Match input height */
    align-items: center;
}

.currency-btn {
    height: 100%;
    padding: 0 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: var(--text-body-2);
    font-weight: 600;
    color: var(--color-text-secondary);
    border-radius: var(--radius-xs);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        color: var(--color-text-primary);
    }

    &.active {
        background: var(--color-primary);
        color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
}

.exchange-rate-control {
    background: rgba(var(--color-primary-rgb), 0.05);
    border: 1px solid rgba(var(--color-primary-rgb), 0.1);
    padding: 16px;
    border-radius: var(--radius-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--text-body-2);
    margin-top: 8px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(var(--color-primary-rgb), 0.08);
    }
}

.rate-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--color-text-secondary);
}

.rate-value {
    border-bottom: 1px dashed var(--color-primary);
    cursor: pointer;
    font-weight: 700;
    color: var(--color-primary);
    transition: all 0.2s;

    &:hover {
        opacity: 0.8;
    }
}

.rate-input {
    width: 80px;
    padding: 4px 8px;
    border: 2px solid var(--color-primary);
    border-radius: var(--radius-xs);
    font-weight: 600;
    color: var(--color-primary);
    background: var(--color-surface);
    outline: none;
}

.converted-price {
    font-size: var(--text-h4);
    font-weight: 700;
    color: var(--color-primary);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.calc-info {
    background: rgba(var(--color-primary-rgb), 0.1);
    padding: 12px;
    border-radius: var(--radius-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-primary);
    font-weight: 500;
}
</style>
