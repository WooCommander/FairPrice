<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { priceStore } from '../store/priceStore'
import FpInput from '@/design-system/components/FpInput.vue'
import FpCard from '@/design-system/components/FpCard.vue'
import FpCombobox from '@/design-system/components/FpCombobox.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import { CatalogService, type ProductDTO } from '@/modules/catalog/services/CatalogService'


const route = useRoute()
const router = useRouter()

const step = ref(1) // 1: Select Product, 2: Enter Details
const storeName = ref('')
const price = ref<string | number>('')
const unit = ref('кг')
const isStoreSelected = ref(false)

const storeResults = ref<{ id: string, name: string }[]>([])
const isSearchingStores = ref(false)

// Create Product State
const isCreating = ref(false)
const newProductName = ref('')
const newProductCategory = ref('Бакалея')
const newProductUnit = ref('шт')

import { PRODUCT_CATEGORIES } from '@/modules/catalog/constants'

const categories = PRODUCT_CATEGORIES.map(c => ({ id: c, name: c }))
const selectedCategory = ref<string | null>(null)

const units = ['шт', 'кг', 'л', 'уп'].map(u => ({ id: u, name: u }))

// Explicitly type as generic string to allow custom categories
const categoryItems = ref<{ id: string, name: string }[]>([...categories])
const unitItems = ref(units)

// Store access
const { currentProduct } = catalogStore
const { isSubmitting } = priceStore

const allProducts = ref<ProductDTO[]>([])
const isLoadingProducts = ref(false)
const gridSearchQuery = ref('')

const loadProducts = async () => {
    isLoadingProducts.value = true
    try {
        const { items } = await CatalogService.searchProducts('', {}, 1, 100)
        allProducts.value = items.sort((a, b) => a.name.localeCompare(b.name))
    } catch (e) {
        console.error('Failed to load products for grid', e)
    } finally {
        isLoadingProducts.value = false
    }
}

const filteredGridProducts = computed(() => {
    let products = allProducts.value

    if (selectedCategory.value) {
        products = products.filter(p => p.category === selectedCategory.value)
    }

    if (gridSearchQuery.value) {
        const q = gridSearchQuery.value.toLowerCase()
        products = products.filter(p => p.name.toLowerCase().includes(q))
    }

    return products
})

const toggleCategory = (cat: string) => {
    if (selectedCategory.value === cat) {
        selectedCategory.value = null
    } else {
        selectedCategory.value = cat
    }
}

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
const selectProduct = (p: { id: string | number, name: string }) => {
    catalogStore.loadProductById(String(p.id))
    step.value = 2
}

const startCreation = () => {
    isCreating.value = true
    newProductName.value = gridSearchQuery.value // Pre-fill with current search query
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
    loadProducts()
    const id = route.params.id as string
    if (id) {
        await catalogStore.loadProductById(id)
        if (currentProduct.value) {
            step.value = 2
            unit.value = currentProduct.value.unit || 'кг'
        }
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

const headerTitle = computed(() => {
    if (step.value === 2 && currentProduct.value) {
        return currentProduct.value.name
    }
    if (isCreating.value) {
        return 'Новый товар'
    }
    return 'Добавить цену'
})

const goBack = () => {
    if (isCreating.value) {
        isCreating.value = false
        return
    }

    if (step.value === 2) {
        // If we entered directly with an ID (from Product View), go back to Product View
        if (route.params.id) {
            router.back()
            return
        }
        step.value = 1
        return
    }

    router.back()
}
</script>

<template>
    <div class="add-price-view">
        <!-- Header -->
        <header class="ergo-header">
            <div class="header-inner">
                <button class="nav-btn" @click="goBack">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div class="header-title">
                    {{ headerTitle }}
                </div>

                <div class="header-actions">
                    <template v-if="isCreating">
                        <button class="action-btn cancel" @click="cancelCreation">Отмена</button>
                        <button class="action-btn primary" :disabled="!newProductName" @click="createProduct">
                            Создать
                        </button>
                    </template>
                    <template v-else-if="step === 2 && !isSuccess">
                        <FpButton :disabled="!isValid || isSubmitting" @click="submit">
                            Сохранить
                        </FpButton>
                    </template>
                </div>
            </div>
        </header>

        <!-- Step 1: Select Product -->
        <section v-if="step === 1" class="step-section">
            <div class="selection-grid-container">
                <div class="search-header">
                    <FpInput v-model="gridSearchQuery" placeholder="Поиск товара..." class="grid-search" />
                </div>

                <div class="category-filters">
                    <button v-for="cat in PRODUCT_CATEGORIES" :key="cat" class="category-tag"
                        :class="{ active: selectedCategory === cat }" @click="toggleCategory(cat)">
                        {{ cat }}
                    </button>
                </div>

                <div v-if="isLoadingProducts" class="loading-state">
                    <FpSpinner />
                </div>

                <div v-else class="product-grid">
                    <!-- Create New Tile -->
                    <button class="product-tile create-tile" @click="startCreation">
                        <div class="tile-icon">+</div>
                        <span class="tile-name">Новый товар</span>
                    </button>

                    <!-- Product Tiles -->
                    <button v-for="item in filteredGridProducts" :key="item.id" class="product-tile"
                        @click="selectProduct({ id: item.id, name: item.name })">
                        <div class="tile-category-icon">{{ item.category?.[0] || '📦' }}</div>
                        <span class="tile-name">{{ item.name }}</span>
                        <span class="tile-category">{{ item.category }}</span>
                    </button>
                </div>
            </div>

            <FpCard class="m-4" v-if="isCreating">
                <div class="creation-form">
                    <h3>Новый товар</h3>
                    <div class="form-grid">
                        <FpInput v-model="newProductName" label="Название" @keydown.enter="createProduct" />

                        <div class="select-group">
                            <FpCombobox v-model="newProductCategory" label="Категория" :items="categoryItems"
                                placeholder="Выберите категорию" allow-create @create="createCategory" />
                        </div>

                    </div>


                </div>
            </FpCard>
        </section>

        <!-- Step 2: Enter Details -->
        <section v-else class="step-section">
            <FpCard>
                <div class="product-summary" v-if="currentProduct">
                    <!-- Title moved to header -->
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


                <div v-if="isSuccess" class="success-message">
                    ✅ Цена успешно добавлена!
                </div>
            </FpCard>
        </section>
    </div>
</template>

<style scoped lang="scss">
.add-price-view {
    padding: 0 0.5rem; // User requested 0.5rem from edge


}

.ergo-header {
    background: var(--color-surface);
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid var(--color-border);
    margin: 0 -0.5rem var(--spacing-md) -0.5rem; // Negative margin to overflow padding
    padding: 12px 16px;
}

.header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.header-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    flex: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 8px;
}

.header-actions {
    display: flex;
    gap: 8px;
    min-width: 40px;
    justify-content: flex-end;
}

.action-btn {
    background: none;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    transition: background 0.2s;

    &.primary {
        color: var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.1);

        &:disabled {
            opacity: 0.5;
            background: transparent;
            cursor: not-allowed;
        }

        &:not(:disabled):hover {
            background: rgba(var(--color-primary-rgb), 0.2);
        }
    }

    &.cancel {
        color: var(--color-text-secondary);

        &:hover {
            background: var(--color-surface-hover);
        }
    }
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

.selection-grid-container {
    padding: 0 var(--spacing-sm);
}

.search-header {
    margin-bottom: var(--spacing-md);
    position: sticky;
    top: 64px; // Adjust based on header height
    background: var(--color-background);
    z-index: 5;
    padding: var(--spacing-sm) 0;
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    padding-bottom: var(--spacing-xl);
}

.product-tile {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    aspect-ratio: 1 / 1;
    justify-content: center;

    &:active {
        transform: scale(0.95);
        background-color: var(--color-surface-hover);
    }

    .tile-icon {
        font-size: 24px;
        color: var(--color-primary);
        margin-bottom: 4px;
    }

    .tile-category-icon {
        font-size: 20px;
        margin-bottom: 4px;
        opacity: 0.7;
    }

    .tile-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-primary);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.2;
    }

    .tile-category {
        font-size: 10px;
        color: var(--color-text-secondary);
        margin-top: 2px;
    }

    &.create-tile {
        border: 2px dashed var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.05);

        .tile-name {
            color: var(--color-primary);
        }
    }
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: var(--spacing-xl);
}

.category-filters {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 4px 0 16px 0;
    margin-bottom: 8px;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        display: none;
    }
}

.category-tag {
    white-space: nowrap;
    padding: 6px 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;

    &.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: white;
    }
}
</style>
