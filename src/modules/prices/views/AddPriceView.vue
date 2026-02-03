<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { priceStore } from '../store/priceStore'
import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'
import FpCombobox from '@/design-system/components/FpCombobox.vue'

const route = useRoute()
const router = useRouter()

const step = ref(1) // 1: Select Product, 2: Enter Details
const searchQuery = ref('')
const storeName = ref('')
const price = ref('')
const currency = ref('UZS')
let debounceTimer: any = null
const isStoreSelected = ref(false)

const storeResults = ref<any[]>([])
const isSearchingStores = ref(false)

// Create Product State
const isCreating = ref(false)
const newProductName = ref('')
const newProductCategory = ref('Бакалея')
const newProductUnit = ref('шт')

const categories = ['Овощи', 'Фрукты', 'Мясо', 'Бакалея', 'Молочные продукты', 'Напитки', 'Бытовая химия']
const units = ['шт', 'кг', 'л', 'уп']

// Store access
const { searchResults, currentProduct } = catalogStore
const { isSubmitting } = priceStore

// Computed
const isValid = computed(() => {
    return storeName.value.length > 2 && price.value.length > 0 && !isNaN(Number(price.value))
})

const comboboxSearchResults = computed(() => {
    // Cast strict readonly types to any for compatibility with generic component if strict typing fails
    return searchResults.value as any[]
})

// Stores Methods
const handleSearchStore = async (val: string) => {
    storeName.value = val
    if (val.length < 2) {
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

const selectStore = (item: any) => {
    storeName.value = item.name
    isStoreSelected.value = true
}

const createStore = (name: string) => {
    storeName.value = name
    isStoreSelected.value = true
}

// Product Methods
const handleSearch = (val: string | number) => {
    const query = String(val)
    searchQuery.value = query

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
        if (query.length > 1) {
            await catalogStore.searchProducts(query)
        }
    }, 300)
}

const selectProduct = (p: any) => {
    catalogStore.loadProductById(p.id)
    step.value = 2
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

    await catalogStore.createProduct({
        name: newProductName.value,
        category: newProductCategory.value,
        unit: newProductUnit.value
    })

    isCreating.value = false
    step.value = 2
}

const isSuccess = ref(false)

const submit = async () => {
    if (!currentProduct.value) return

    try {
        await priceStore.submitPrice({
            productId: currentProduct.value.id,
            storeName: storeName.value,
            price: Number(price.value),
            currency: currency.value as 'UZS'
        })
        isSuccess.value = true
        setTimeout(() => {
            if (currentProduct.value) {
                router.push(`/product/${currentProduct.value.id}`)
            }
        }, 1500)
    } catch (e) {
        alert('Ошибка при сохранении')
    }
}

onMounted(async () => {
    const id = route.params.id as string
    if (id) {
        await catalogStore.loadProductById(id)
        if (currentProduct.value) {
            step.value = 2
        }
    } else {
        catalogStore.clearSearch()
    }
})
</script>

<template>
    <div class="add-price-view">
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
                        @create="handleProductCreate" />
                </div>

                <div v-else class="creation-form">
                    <h3>Новый товар</h3>
                    <div class="form-grid">
                        <FpInput v-model="newProductName" label="Название" />

                        <div class="select-group">
                            <label>Категория</label>
                            <select v-model="newProductCategory">
                                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                            </select>
                        </div>

                        <div class="select-group">
                            <label>Ед. изм.</label>
                            <select v-model="newProductUnit">
                                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
                            </select>
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
                            @create="createStore" />
                    </div>

                    <FpInput v-model="price" label="Цена" type="number" placeholder="0" />

                    <div class="currency-badge">{{ currency }}</div>
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
.add-price-view {
    max-width: 600px;
    margin: 0 auto;
}

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

    h3 {
        margin: 0;
        font-size: var(--text-body-1);
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

.currency-badge {
    position: absolute;
    bottom: 38px;
    right: 12px;
    font-size: var(--text-caption);
    color: var(--color-text-secondary);
    font-weight: 600;
}

.store-field {
    position: relative;
}

.success-message {
    text-align: center;
    color: var(--color-success);
    font-weight: 600;
    padding: var(--spacing-md);
    background: #f0fdf4;
    border-radius: var(--radius-md);
    margin-top: var(--spacing-md);
}

.select-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
    }

    select {
        padding: 12px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-surface);
        font-size: var(--text-body-1);
    }
}

.actions-row {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
}
</style>
