<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
    modelValue: string
    placeholder?: string
    autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    placeholder: 'Поиск...',
    autofocus: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'search'): void
    (e: 'clear'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value
    emit('update:modelValue', value)
    emit('search')
}

function clear() {
    emit('update:modelValue', '')
    emit('clear')
    emit('search')
    inputRef.value?.focus()
}

onMounted(() => {
    if (props.autofocus && inputRef.value) {
        inputRef.value.focus()
    }
})
</script>

<template>
    <div class="fp-search-input">
        <div class="input-wrapper">
            <input ref="inputRef" :value="modelValue" type="text" class="search-field" :placeholder="placeholder"
                @input="onInput" />
            <button v-if="modelValue" class="clear-btn" @click="clear" aria-label="Очистить">
                ✕
            </button>
            <span v-else class="search-icon">🔍</span>
        </div>
    </div>
</template>

<style scoped lang="scss">
.fp-search-input {
    width: 100%;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-field {
    width: 100%;
    padding: 12px 16px;
    padding-right: 40px; // Space for icon/clear button
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    font-size: var(--text-body-1);
    background: var(--color-surface);
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
    }

    &::placeholder {
        color: var(--color-text-tertiary);
    }
}

.clear-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--color-text-primary);
    }
}

.search-icon {
    position: absolute;
    right: 16px;
    font-size: 16px;
    opacity: 0.5;
    pointer-events: none;
}
</style>
