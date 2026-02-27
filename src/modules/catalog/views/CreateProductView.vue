<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { PRODUCT_CATEGORIES } from '@/modules/catalog/constants'
import FpInput from '@/design-system/components/FpInput.vue'
import FpCombobox from '@/design-system/components/FpCombobox.vue'
import FpButton from '@/design-system/components/FpButton.vue'

const router = useRouter()
const name = ref('')
const category = ref('Бакалея')
const unit = ref('шт')
const isSubmitting = ref(false)

const categories = PRODUCT_CATEGORIES.map(c => ({ id: c, name: c }))
const units = ['шт', 'кг', 'л', 'уп'].map(u => ({ id: u, name: u }))

const categoryItems = ref(categories)
const unitItems = ref(units)

const handleCreate = async () => {
    if (!name.value) return

    isSubmitting.value = true
    try {
        const product = await catalogStore.createProduct({
            name: name.value,
            category: category.value as any,
            unit: unit.value
        })
        router.push(`/product/${product.id}`)
    } catch (error: any) {
        console.error('Failed to create product:', error)
        alert(`Ошибка: ${error.message || error}`)
    } finally {
        isSubmitting.value = false
    }
}

const createCategory = (val: string) => {
    categoryItems.value.push({ id: val, name: val })
    category.value = val
}

const createUnit = (val: string) => {
    unitItems.value.push({ id: val, name: val })
    unit.value = val
}
</script>

<template>
    <div class="create-view">
        <header class="section-header">
            <h1>Новый товар</h1>
            <p>Добавьте товар в каталог, чтобы потом указать его цену</p>
        </header>

        <FpCard class="form-card">
            <div class="form-grid">
                <FpInput v-model="name" label="Название товара" placeholder="Например: Сыр Российский" autofocus />

                <FpCombobox v-model="category" label="Категория" :items="categoryItems" allow-create
                    @create="createCategory" />

                <FpCombobox v-model="unit" label="Единица измерения" :items="unitItems" allow-create
                    @create="createUnit" />

                <div class="actions">
                    <FpButton size="lg" full-width :disabled="!name || isSubmitting" @click="handleCreate">
                        {{ isSubmitting ? 'Создание...' : 'Создать товар' }}
                    </FpButton>
                </div>
            </div>
        </FpCard>
    </div>
</template>

<style scoped lang="scss">
.create-view {
    padding: var(--spacing-md);
}

.section-header {
    margin-bottom: var(--spacing-xl);
    text-align: center;

    h1 {
        font-size: var(--text-h4);
        font-weight: 700;
        margin-bottom: 8px;
    }

    p {
        color: var(--color-text-secondary);
        font-size: var(--text-body-2);
    }
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.actions {
    margin-top: var(--spacing-md);
}
</style>
