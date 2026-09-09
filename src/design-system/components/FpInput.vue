<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string | number
  label?: string
  placeholder?: string
  type?: 'text' | 'number' | 'password' | 'email' | 'date'
  error?: string
  disabled?: boolean
  id?: string
  /** 'filled' = Material bottom-border w/ floating label (default); 'outlined' = bordered box w/ static top label */
  variant?: 'filled' | 'outlined'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  variant: 'filled'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const isFocused = ref(false)
const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`

const hasValue = computed(() => {
  return props.modelValue !== null && props.modelValue !== ''
})

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const val = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', val)
}

const onFocus = () => {
  isFocused.value = true
  emit('focus')
}

const onBlur = () => {
  isFocused.value = false
  emit('blur')
}
</script>

<template>
  <div class="fp-input-wrapper" :class="[`variant-${variant}`, { 'has-error': !!props.error, 'is-focused': isFocused, 'has-value': hasValue }]">
    <span v-if="variant === 'outlined' && props.label" class="fp-top-label">{{ props.label }}</span>
    <div class="input-container">
      <input :id="inputId" class="fp-input" :type="props.type" :value="props.modelValue" :disabled="props.disabled"
        :placeholder="variant === 'filled' && props.label && !isFocused && !hasValue ? '' : props.placeholder || ' '" @input="onInput"
        @focus="onFocus" @blur="onBlur" />
      <label v-if="variant === 'filled' && props.label" :for="inputId" class="fp-label">
        {{ props.label }}
      </label>
    </div>
    <span v-if="props.error" class="error-text">{{ props.error }}</span>
  </div>
</template>

<style scoped lang="scss">
.fp-input-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-md);
  position: relative;
}

.input-container {
  position: relative;
  background-color: var(--color-surface);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  border-bottom: 2px solid var(--color-border);
  transition: border-color 0.2s;
  height: 56px; // Material Default

  display: flex;
  align-items: flex-end; // Align input to bottom
}

.fp-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 16px;
  font-size: var(--text-body-1);
  color: var(--color-text-primary);
  outline: none;
  height: 28px;
  margin-bottom: 8px; // Space for text
}

.fp-label {
  position: absolute;
  left: 16px;
  top: 16px;
  font-size: var(--text-body-1);
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  pointer-events: none;
}

// States
.is-focused .input-container {
  border-bottom-color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 4%, transparent);
}

.has-error .input-container {
  border-bottom-color: var(--color-error);
}

.is-focused .fp-label,
.has-value .fp-label {
  top: 4px;
  font-size: var(--text-caption);
  color: var(--color-primary);
}

.has-error .fp-label {
  color: var(--color-error);
}

.error-text {
  font-size: var(--text-caption);
  color: var(--color-error);
  padding: 4px 16px 0;
}

/* ── Outlined variant ──────────────────────────────── */
.variant-outlined {
  gap: 5px;
  margin-bottom: 0; // spacing controlled by parent layout

  .fp-top-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    padding-left: 2px;
  }

  .input-container {
    height: 44px;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    align-items: center;
  }

  .fp-input {
    height: 100%;
    margin-bottom: 0;
    padding: 0 12px;
    font-size: 16px;
  }

  &.is-focused .input-container {
    border-color: var(--color-primary);
    background-color: var(--color-surface);
  }

  &.has-error .input-container {
    border-color: var(--color-error);
  }

  .error-text {
    padding: 0 2px;
  }
}
</style>
