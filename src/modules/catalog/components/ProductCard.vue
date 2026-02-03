<script setup lang="ts">
import type { ProductModel } from '../adapters/CatalogAdapter'

interface Props {
    product: ProductModel
}

const props = defineProps<Props>()

const emit = defineEmits<{
    (e: 'click', id: string): void
}>()
</script>

<template>
    <div class="product-card" @click="emit('click', props.product.id)">
        <div class="product-info">
            <h4 class="product-name">{{ props.product.name }}</h4>
            <span class="product-category">{{ props.product.category }}</span>
        </div>
        <div class="product-meta">
            <span class="product-price">{{ props.product.formattedPrice }}</span>
            <span class="product-time">{{ props.product.lastUpdateRelative }}</span>
        </div>
    </div>
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

.product-meta {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.product-price {
    font-weight: 600;
    color: var(--color-primary);
    font-size: var(--text-body-2);
}

.product-time {
    font-size: 10px;
    color: var(--color-text-disabled);
}
</style>
