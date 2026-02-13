<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  item: any
}

const props = defineProps<Props>()

const priceColorClass = computed(() => {
  if (props.item.priceStatus === 'good') return 'text-success'
  if (props.item.priceStatus === 'bad') return 'text-error'
  return 'text-neutral'
})
</script>

<template>
  <div class="card-minimal">
    <div class="top-row">
      <span class="category">{{ item.category }}</span>
      <span class="date">{{ item.lastUpdateRelative }}</span>
    </div>

    <div class="main-content">
      <h3 class="name">{{ item.displayName }}</h3>
      <div class="price-block">
        <span class="price" :class="priceColorClass">{{ item.formattedPrice }}</span>
        <span class="unit" v-if="item.formattedUnitPrice">{{ item.formattedUnitPrice }}</span>
      </div>
    </div>

    <div class="footer">
      <div class="store" v-if="item.lastStore">
        <span class="store-icon">🏪</span>
        {{ item.lastStore }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card-minimal {
  background: var(--color-surface);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03); // Very subtle shadow
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid transparent;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    background: var(--color-surface-hover);
  }
}

.top-row {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.name {
  font-size: 16px;
  font-weight: 500; // Medium weight, not bold
  color: var(--color-text-primary);
  line-height: 1.4;
  margin: 0;
  flex: 1;
}

.price-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price {
  font-size: 20px;
  font-weight: 300; // Thin font for elegance
}

.unit {
  font-size: 1rem;
  color: var(--color-text-secondary);
}

.footer {
  margin-top: 4px;
}

.store {
  font-size: 1rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-success {
  color: var(--color-success);
}

.text-error {
  color: var(--color-error);
}

.text-neutral {
  color: var(--color-text-primary);
}
</style>
