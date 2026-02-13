<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    item: any
}

const props = defineProps<Props>()

const priceColorClass = computed(() => {
    if (props.item.priceStatus === 'good') return 'bg-success'
    if (props.item.priceStatus === 'bad') return 'bg-error'
    return 'bg-neutral'
})

// Visual placeholder for category
const getCategoryIcon = (cat: string) => {
    if (cat === 'Овощи') return '🥦'
    if (cat === 'Фрукты') return '🍎'
    if (cat === 'Мясо') return '🍖'
    if (cat === 'Молочные продукты') return '🥛'
    return '📦'
}
</script>

<template>
    <div class="card-visual">
        <div class="icon-area">
            {{ getCategoryIcon(item.category) }}
        </div>

        <div class="content-area">
            <div class="header">
                <h3 class="name">{{ item.displayName }}</h3>
                <div class="price-tag" :class="priceColorClass">
                    {{ item.formattedPrice }}
                </div>
            </div>

            <div class="details">
                <div class="store-badge" v-if="item.lastStore">
                    🏪 {{ item.lastStore }}
                </div>
                <span class="unit" v-if="item.formattedUnitPrice">{{ item.formattedUnitPrice }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.card-visual {
    background: var(--color-surface);
    border-radius: 20px; // Very rounded
    padding: 12px;
    display: flex;
    gap: 12px;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--color-border);
    position: relative;
    overflow: hidden;

    // Decor element
    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: var(--color-primary);
        opacity: 0.5;
    }
}

.icon-area {
    font-size: 28px;
    width: 48px;
    height: 48px;
    background: var(--color-background);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.name {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.2;
}

.price-tag {
    font-size: 14px;
    font-weight: 700;
    color: white;
    padding: 4px 8px;
    border-radius: 8px;
    white-space: nowrap;
}

.bg-success {
    background: var(--color-success);
}

.bg-error {
    background: var(--color-error);
}

.bg-neutral {
    background: var(--color-text-secondary);
}

.details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1rem;
}

.store-badge {
    color: var(--color-text-secondary);
    font-weight: 500;
    background: var(--color-background);
    padding: 2px 6px;
    border-radius: 4px;
}

.unit {
    color: var(--color-text-tertiary);
}
</style>
