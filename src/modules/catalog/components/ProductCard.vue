<script setup lang="ts">
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import type { Product } from '../services/CatalogService'

interface Props {
    product: Product
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'click', id: string): void
}>()
</script>

<template>
    <FpCard class="product-card" @click="emit('click', props.product.id)">
        <div class="product-info">
            <h4 class="product-name">{{ props.product.name }}</h4>
            <span class="product-category">{{ props.product.category }}</span>
        </div>
        <div class="product-action">
            <FpButton variant="text" size="sm">></FpButton>
        </div>
    </FpCard>
</template>

<style scoped lang="scss">
.product-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    margin-bottom: var(--spacing-sm);

    &:hover {
        background-color: rgba(0, 0, 0, 0.02);
    }
}

.product-info {
    display: flex;
    flex-direction: column;
}

.product-name {
    margin: 0;
    font-size: var(--text-body-1);
    font-weight: 500;
}

.product-category {
    font-size: var(--text-caption);
    color: var(--color-text-secondary);
}
</style>
