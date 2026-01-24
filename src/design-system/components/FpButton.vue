<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'text' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'full'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const classes = computed(() => [
  'fp-button',
  `fp-button--${props.variant}`,
  `fp-button--${props.size}`,
  { 'fp-button--loading': props.loading }
])
</script>

<template>
  <button :class="classes" :disabled="props.disabled || props.loading" :type="props.type" @click="emit('click', $event)">
    <span v-if="loading" class="fp-button__loader">...</span>
    <span v-else class="fp-button__content">
      <slot />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '../tokens.scss' as *;

.fp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: var(--font-family-base);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;

  // Sizes & Radius
  &--sm {
    height: 32px;
    padding: 0 var(--spacing-md);
    font-size: var(--text-caption);
    border-radius: var(--radius-sm);
  }

  &--md {
    height: var(--touch-target-min); // 48px
    padding: 0 var(--spacing-lg);
    font-size: var(--text-button);
    border-radius: var(--radius-md);
  }

  &--lg {
    height: 56px;
    padding: 0 var(--spacing-xl);
    font-size: var(--text-body-1);
    border-radius: var(--radius-md);
  }

  &--full {
    width: 100%;
    height: var(--touch-target-min);
    font-size: var(--text-button);
    border-radius: var(--radius-md);
  }

  // Variants
  &--primary {
    background-color: var(--color-primary);
    color: var(--color-on-primary);
    box-shadow: var(--shadow-1);

    &:active:not(:disabled) {
      box-shadow: var(--shadow-2);
      filter: brightness(1.1);
    }
  }

  &--secondary {
    background-color: var(--color-secondary);
    color: var(--color-on-secondary);
  }

  &--text {
    background-color: transparent;
    color: var(--color-primary);
    box-shadow: none;
    
    &:hover {
      background-color: rgba(98, 0, 238, 0.04);
    }
  }
  
  &--outline {
    background-color: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
  }

  &--danger {
    background-color: var(--color-error);
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none !important;
    filter: none !important;
  }
}
</style>
