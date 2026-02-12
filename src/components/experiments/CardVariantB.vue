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
  <div class="card-compact">
    <div class="left-col">
      <h3 class="name">{{ item.displayName }}</h3>
      <div class="meta">
        <span class="store" v-if="item.lastStore">@{{ item.lastStore }}</span>
        <span class="dot">•</span>
        <span class="category">{{ item.category }}</span>
      </div>
    </div>
    
    <div class="right-col">
      <span class="price" :class="priceColorClass">{{ item.formattedPrice }}</span>
      <span class="date">{{ item.lastUpdateRelative }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card-compact {
  background: var(--color-surface);
  padding: 12px 0; // Top/bottom padding only
  border-bottom: 1px solid var(--color-border); // List style separator
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  &:active {
    background: var(--color-surface-hover);
  }
  
  &:last-child {
      border-bottom: none;
  }
}

.left-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.meta {
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
    color: var(--color-border);
}

.right-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 80px;
}

.price {
  font-size: 16px;
  font-weight: 700;
}

.date {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.text-success { color: var(--color-success); }
.text-error { color: var(--color-error); }
.text-neutral { color: var(--color-text-primary); }
</style>
