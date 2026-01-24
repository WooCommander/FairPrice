<script setup lang="ts">
interface Props {
  flat?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  flat: false,
  padding: 'md'
})
</script>

<template>
  <div class="fp-card" :class="[ `padding-${props.padding}`, { 'is-flat': props.flat } ]">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.fp-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-1);
  transition: box-shadow 0.2s;
  color: var(--color-text-primary);
  overflow: hidden;

  &.is-flat {
    box-shadow: none;
    border: 1px solid var(--color-border);
  }

  &.padding-none { padding: 0; }
  &.padding-sm { padding: var(--spacing-sm); }
  &.padding-md { padding: var(--spacing-md); }
  &.padding-lg { padding: var(--spacing-lg); }
}
</style>
