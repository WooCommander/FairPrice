<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { priceStore } from '../store/priceStore'
import { PRODUCT_CATEGORIES } from '@/modules/catalog/constants'
import {
    FpButton,
    FpInput,
    FpCard,
    FpCombobox,
    FpMobilePicker
} from '@/design-system'

const route = useRoute()
const router = useRouter()

// State
const step = ref(1) // 1: Select Product, 2: Enter Details
const searchQuery = ref('')
const selectedCategory = ref<string | null>(route.query.category as string || null)
const isCreating = ref(false)
const { isLoading, hasMore } = catalogStore

// Form data
const currentProduct = ref<{ id: string, name: string, category: string, unit?: string } | null>(null)
const storeName = ref('')
const storeResults = ref<{ id: string, name: string }[]>([])
const isSearchingStores = ref(false)
const price = ref('')
const quantity = ref('1')
const unit = ref('кг')
const isSuccess = ref(false)

// Create product state
const newProductName = ref('')
const newProductCategory = ref('')

const unitItems = ['г', 'кг', 'мл', 'л', 'шт', 'уп'].map(u => ({ id: u, name: u }))
const categoryItems = PRODUCT_CATEGORIES.map(c => ({ id: c, name: c }))

// Subscriptions
const products = computed(() => catalogStore.searchResults.value)

const filteredGridProducts = computed(() => products.value)

const calculatedUnitPrice = computed(() => {
    const p = parseFloat(price.value)
    const q = parseFloat(quantity.value)
    if (!p || !q) return null

    const res = (p / q) * (unit.value === 'кг' || unit.value === 'л' ? 1 : 1000)
    return {
        price: Math.round(res),
        unit: unit.value === 'кг' || unit.value === 'л' ? unit.value : (unit.value === 'шт' ? 'шт' : (unit.value === 'мл' ? 'л' : 'кг'))
    }
})

// Methods
const loadProducts = async () => {
    await catalogStore.searchProducts(searchQuery.value, {
        category: selectedCategory.value || undefined
    })
}

const toggleCategory = (cat: string) => {
    selectedCategory.value = selectedCategory.value === cat ? null : cat
}

const selectProduct = (p: { id: string, name: string }) => {
    const fullProduct = products.value.find(item => item.id === p.id)
    currentProduct.value = {
        id: p.id,
        name: p.name,
        category: fullProduct?.category || 'Разное',
        unit: fullProduct?.unit
    }
    if (fullProduct?.unit) {
        unit.value = fullProduct.unit
    }
    if (fullProduct?.lastStore) {
        storeName.value = fullProduct.lastStore
    }
    step.value = 2
}

const startCreation = () => {
    newProductName.value = searchQuery.value
    newProductCategory.value = selectedCategory.value || ''
    isCreating.value = true
}

const createProduct = async () => {
    if (!newProductName.value) return
    try {
        const product = await catalogStore.createProduct({
            name: newProductName.value,
            category: newProductCategory.value || 'Разное',
            unit: 'г' // Default unit
        })
        selectProduct({ id: product.id, name: product.name })
        isCreating.value = false
    } catch (e: any) {
        alert(e.message)
    }
}

const onStoreSelect = (s: any) => {
    storeName.value = s.name
}

const onStoreCreate = (name: string) => {
    storeName.value = name
}

const handleSearchStore = async (q: string) => {
    storeName.value = q
    if (q.length < 1) {
        // Load some initial stores
        const results = await priceStore.getStores('')
        storeResults.value = results
        return
    }
    isSearchingStores.value = true
    try {
        const results = await priceStore.getStores(q)
        storeResults.value = results
    } finally {
        isSearchingStores.value = false
    }
}


const submit = async () => {
    if (!currentProduct.value || !storeName.value || !price.value) return

    try {
        await priceStore.submitPrice({
            productId: currentProduct.value.id,
            storeName: storeName.value,
            price: parseFloat(price.value),
            currency: 'RUB',
            quantity: parseFloat(quantity.value) || 1,
            quantityUnit: unit.value
        })
        isSuccess.value = true
        setTimeout(() => {
            if (currentProduct.value) {
                router.push(`/product/${currentProduct.value.id}`)
            } else {
                router.push('/')
            }
        }, 1500)
    } catch (e) {
        console.error(e)
    }
}

onMounted(() => {
    handleSearchStore('') // Pre-fetch stores
    const id = route.params.id as string
    if (id) {
        // Direct entry
        catalogStore.loadProductById(id).then(() => {
            if (catalogStore.currentProduct.value) {
                const p = catalogStore.currentProduct.value
                currentProduct.value = { id: p.id, name: p.name, category: p.category, unit: p.unit }
                if (p.unit) unit.value = p.unit
                if (p.lastStore) storeName.value = p.lastStore
                step.value = 2
            }
        })
    } else {
        loadProducts()
    }
})

// Watch for filter changes
watch([searchQuery, selectedCategory], ([q, cat]) => {
    catalogStore.searchProducts(q, {
        category: cat || undefined
    })
})
</script>

<template>
    <div class="add-price-view">
        <header class="ergo-header">
            <div class="header-inner">
                <button class="nav-btn" @click="step === 1 ? router.back() : step = 1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <h1 class="header-title">
                    {{ step === 1 ? 'Добавить цену' : currentProduct?.name }}
                </h1>
                <div class="header-actions">
                    <button v-if="step === 2" class="action-btn-text" :disabled="!storeName || !price || !quantity"
                        @click="submit">
                        Готово
                    </button>
                    <div v-else style="width: 40px"></div>
                </div>
            </div>
        </header>

        <!-- Step 1: Select Product -->
        <section v-if="step === 1" class="step-section">
            <div class="sticky-search-wrapper">
                <div class="search-input-group">
                    <FpInput v-model="searchQuery" placeholder="Поиск товара..." class="flex-grow" />
                </div>

                <div class="category-filters">
                    <button v-for="cat in PRODUCT_CATEGORIES" :key="cat" class="category-tag"
                        :class="{ active: selectedCategory === cat }" @click="toggleCategory(cat)">
                        {{ cat }}
                    </button>
                </div>
            </div>

            <div v-if="isLoading" class="standard-grid">
                <div v-for="i in 8" :key="i" class="fp-tile skeleton">
                    <div class="tile-info">
                        <div class="skeleton-line sm"></div>
                        <div class="skeleton-line lg"></div>
                    </div>
                </div>
            </div>

            <div v-else-if="!isLoading && !isCreating" class="standard-grid">
                <!-- Create New Tile -->
                <div class="fp-tile create-tile" @click="startCreation">
                    <div class="tile-info">
                        <span class="subtitle">Новый</span>
                        <h3 class="title">+ Добавить товар</h3>
                    </div>
                </div>

                <!-- Product Tiles -->
                <div v-for="item in filteredGridProducts" :key="item.id" class="fp-tile"
                    @click="selectProduct({ id: item.id, name: item.name })">
                    <div class="tile-info">
                        <span class="subtitle">{{ item.category }}</span>
                        <h3 class="title">{{ item.name }}</h3>
                    </div>
                </div>
            </div>

            <!-- Load More Container -->
            <div v-if="hasMore && !isCreating" class="load-more-container">
                <FpButton variant="outline" size="full" :loading="isLoading" @click="catalogStore.loadMore">
                    Загрузить еще
                </FpButton>
            </div>

            <FpCard class="m-4" v-if="isCreating">
                <div class="creation-form">
                    <h3>Новый товар</h3>
                    <div class="form-grid">
                        <FpInput v-model="newProductName" label="Название" @keydown.enter="createProduct" />
                        <FpCombobox v-model="newProductCategory" label="Категория" :items="categoryItems"
                            placeholder="Выберите категорию" allow-create @create="newProductCategory = $event" />
                    </div>
                    <div class="actions-row">
                        <FpButton variant="outline" @click="isCreating = false">Отмена</FpButton>
                        <FpButton :disabled="!newProductName" @click="createProduct">Создать</FpButton>
                    </div>
                </div>
            </FpCard>
        </section>

        <!-- Step 2: Enter Details -->
        <section v-else class="step-section">
            <FpCard>
                <div class="product-summary">
                    <span class="category">{{ currentProduct?.category }}</span>
                    <button class="change-btn" @click="step = 1">Изменить товар</button>
                </div>

                <div class="form-grid">
                    <FpMobilePicker v-model="storeName" label="Магазин" placeholder="Где купили?" title="Выбор магазина"
                        :items="storeResults" allow-create @select="onStoreSelect" @create="onStoreCreate"
                        @search="handleSearchStore" />

                    <div class="price-row">
                        <FpInput v-model="price" label="Цена (₽)" type="number" placeholder="0" class="price-input" />
                    </div>

                    <div class="quantity-row">
                        <FpInput v-model="quantity" label="Вес/Объем" type="number" placeholder="900"
                            class="quantity-input" />
                        <div class="unit-select">
                            <FpMobilePicker v-model="unit" label="Ед." :items="unitItems" placeholder="г"
                                title="Единица изм." allow-create @create="unit = $event" />
                        </div>
                    </div>

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
    padding: 0 0.5rem;
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
}

.header-title {
    font-size: 18px;
    font-weight: 600;
    flex: 1;
    text-align: center;
    margin: 0 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nav-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.action-btn-text {
    color: var(--color-primary);
    font-weight: 600;
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.product-summary {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--color-border);

    .category {
        color: var(--color-text-secondary);
        font-size: 12px;
    }

    .change-btn {
        color: var(--color-primary);
        background: none;
        border: none;
        font-size: 12px;
        text-decoration: underline;
        cursor: pointer;
    }
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.price-row,
.quantity-row {
    display: flex;
    gap: 12px;
}

.price-input,
.quantity-input {
    flex: 1;
}

.unit-select {
    width: 100px;
}

.calc-info {
    background: rgba(var(--color-primary-rgb), 0.1);
    padding: 12px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    color: var(--color-primary);
    font-weight: 600;
}

.create-tile {
    border: 2px dashed var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);

    .title {
        color: var(--color-primary);
    }
}

.creation-form {
    padding: 16px;

    h3 {
        margin-bottom: 16px;
    }
}

.actions-row {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}

.success-message {
    text-align: center;
    margin-top: 20px;
    color: var(--color-success);
    font-weight: 600;
}

// Ergonomic adjustments for tiles without footer
.fp-tile {
    justify-content: center;
    min-height: 80px;

    .tile-info {
        text-align: center;
        width: 100%;
    }
}

.load-more-container {
    padding: 16px;
    margin-bottom: 40px;
}
</style>
