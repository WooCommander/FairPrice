<script setup lang="ts">
import { computed } from 'vue'

interface Props {
    modelValue: number | string
    label?: string
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: 0,
    step: 1,
    disabled: false
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void
}>()

const num = computed(() => Number(props.modelValue) || 0)

const canDec = computed(() => !props.disabled && (props.min === undefined || num.value > props.min))
const canInc = computed(() => !props.disabled && (props.max === undefined || num.value < props.max))

const decrement = () => {
    if (!canDec.value) return
    const next = parseFloat((num.value - (props.step ?? 1)).toPrecision(10))
    emit('update:modelValue', props.min !== undefined ? Math.max(next, props.min) : next)
}

const increment = () => {
    if (!canInc.value) return
    const next = parseFloat((num.value + (props.step ?? 1)).toPrecision(10))
    emit('update:modelValue', props.max !== undefined ? Math.min(next, props.max) : next)
}

const onInput = (e: Event) => {
    const val = Number((e.target as HTMLInputElement).value)
    if (!isNaN(val)) emit('update:modelValue', val)
}

const onBlur = (e: Event) => {
    let val = Number((e.target as HTMLInputElement).value)
    if (isNaN(val)) val = num.value
    if (props.min !== undefined) val = Math.max(val, props.min)
    if (props.max !== undefined) val = Math.min(val, props.max)
    emit('update:modelValue', val)
}
</script>

<template>
    <div class="fp-number-input" :class="{ 'is-disabled': disabled }">
        <span v-if="label" class="fp-number-label">{{ label }}</span>
        <div class="fp-number-stepper">
            <button
                class="stepper-btn"
                type="button"
                :disabled="!canDec"
                @click="decrement"
                aria-label="Уменьшить"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>

            <span class="stepper-divider" />

            <input
                class="stepper-input"
                type="number"
                :value="modelValue"
                :min="min"
                :max="max"
                :step="step"
                :disabled="disabled"
                :placeholder="placeholder"
                inputmode="decimal"
                @input="onInput"
                @blur="onBlur"
            />

            <span class="stepper-divider" />

            <button
                class="stepper-btn"
                type="button"
                :disabled="!canInc"
                @click="increment"
                aria-label="Увеличить"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.fp-number-input {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &.is-disabled {
        opacity: 0.5;
        pointer-events: none;
    }
}

.fp-number-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    padding-left: 2px;
    letter-spacing: 0.01em;
}

.fp-number-stepper {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
    overflow: hidden;
    transition: border-color 0.2s;
    height: 48px;

    &:focus-within {
        border-color: var(--color-primary);
    }
}

.stepper-btn {
    flex-shrink: 0;
    width: 48px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: background 0.15s, color 0.15s;

    &:active:not(:disabled) {
        background: var(--color-surface-hover);
        color: var(--color-primary);
    }

    &:hover:not(:disabled) {
        background: var(--color-surface-hover);
        color: var(--color-primary);
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
}

.stepper-divider {
    width: 1px;
    height: 28px;
    background: var(--color-border);
    flex-shrink: 0;
}

.stepper-input {
    flex: 1;
    min-width: 0;
    text-align: center;
    border: none;
    background: transparent;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    padding: 0 4px;
    height: 100%;
    outline: none;
    font-family: var(--font-family-base);

    // Remove native spinners
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    -moz-appearance: textfield;
}
</style>
