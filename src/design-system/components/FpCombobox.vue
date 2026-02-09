<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ComboboxItem {
    id: string | number
    name: string
    [key: string]: any
}

interface Props {
    modelValue: string
    items: ComboboxItem[]
    label?: string
    placeholder?: string
    loading?: boolean
    allowCreate?: boolean
    createLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    items: () => [],
    loading: false,
    allowCreate: false,
    createLabel: 'Добавить',
    placeholder: ''
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'select', item: ComboboxItem): void
    (e: 'create', query: string): void
    (e: 'focus'): void
    (e: 'blur'): void
}>()

const isOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const selectedIndex = ref(-1)
const isFiltering = ref(false)

const filteredItems = computed(() => {
    if (!isFiltering.value) {
        return props.items
    }
    const q = props.modelValue.toLowerCase()
    return props.items.filter(i => i.name.toLowerCase().includes(q))
})

const showCreateOption = computed(() => {
    return props.allowCreate &&
        props.modelValue.length > 0 &&
        !props.items.find(i => i.name.toLowerCase() === props.modelValue.toLowerCase())
})

const onInput = (e: Event) => {
    const val = (e.target as HTMLInputElement).value
    emit('update:modelValue', val)
    isOpen.value = true
    isFiltering.value = true
    selectedIndex.value = -1
}

const selectItem = (item: ComboboxItem) => {
    emit('update:modelValue', item.name)
    emit('select', item)
    isOpen.value = false
}

const onCreate = () => {
    emit('create', props.modelValue)
    isOpen.value = false
}

const onFocus = () => {
    isOpen.value = true
    isFiltering.value = false
    emit('focus')
}

const onBlur = () => {
    emit('blur')
}

const handleClickOutside = (e: MouseEvent) => {
    if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
        isOpen.value = false
        emit('blur')
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
    <div class="fp-combobox" ref="wrapperRef">
        <div class="input-wrapper" :class="{ 'is-focused': isOpen }">
            <input ref="inputRef" class="fp-input" type="text" :value="modelValue" @input="onInput" @focus="onFocus"
                @blur="onBlur" :placeholder="isOpen ? placeholder : ''" />
            <label v-if="label" class="fp-label" :class="{ 'has-value': modelValue || isOpen }">
                {{ label }}
            </label>
            <div v-if="loading" class="spinner"></div>
            <div v-else class="chevron" :class="{ 'is-open': isOpen }">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </div>
        </div>

        <div class="dropdown" v-if="isOpen && (items.length > 0 || showCreateOption)">
            <div v-for="(item, index) in filteredItems" :key="item.id" class="dropdown-item"
                :class="{ 'selected': index === selectedIndex }" @click="selectItem(item)">
                <slot name="item" :item="item">
                    {{ item.name }}
                </slot>
            </div>

            <div v-if="showCreateOption" class="dropdown-item create-option" @click="onCreate">
                <span class="plus-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </span>
                <span class="create-text">
                    {{ createLabel }} <span class="highlight">"{{ modelValue }}"</span>
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.fp-combobox {
    position: relative;
    width: 100%;
    margin-bottom: var(--spacing-md);
}

.input-wrapper {
    position: relative;
    background-color: var(--color-surface);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    border-bottom: 2px solid var(--color-border);
    height: 56px;
    display: flex;
    align-items: flex-end;
    transition: all 0.2s ease;

    &.is-focused {
        border-bottom-color: var(--color-primary);
        background-color: rgba(var(--color-primary-rgb), 0.04);
    }
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
    margin-bottom: 8px;
}

.fp-label {
    position: absolute;
    left: 16px;
    top: 16px;
    font-size: var(--text-body-1);
    color: var(--color-text-secondary);
    transition: all 0.2s ease;
    pointer-events: none;

    &.has-value {
        top: 4px;
        font-size: var(--text-caption);
        color: var(--color-primary);
    }
}

.dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-top: none;
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
    max-height: 250px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dropdown-item {
    padding: 12px 16px;
    cursor: pointer;
    font-size: var(--text-body-1);
    color: var(--color-text-primary);
    transition: background-color 0.1s;

    &:hover,
    &.selected {
        background: var(--color-background);
    }
}

.create-option {
    color: var(--color-primary);
    font-weight: 500;
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;

    &:hover {
        background-color: rgba(var(--color-primary-rgb), 0.04);
    }

    .plus-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: rgba(var(--color-primary-rgb), 0.1);
        border-radius: 50%;
        color: var(--color-primary);
    }

    .highlight {
        font-weight: 700;
    }
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    position: absolute;
    right: 16px;
    bottom: 18px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.chevron {
    position: absolute;
    right: 12px;
    bottom: 12px;
    color: var(--color-text-secondary);
    transition: transform 0.2s ease;
    pointer-events: none;

    &.is-open {
        transform: rotate(180deg);
        color: var(--color-primary);
    }
}
</style>
