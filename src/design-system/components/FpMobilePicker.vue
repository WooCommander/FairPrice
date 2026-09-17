<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ChevronDown, X, Pencil, Trash2, Check } from 'lucide-vue-next'
import FpInput from './FpInput.vue'
import FpConfirmationModal from './FpConfirmationModal.vue'

interface Item {
    id: string | number
    name: string
    [key: string]: any
}

interface Props {
    modelValue: string
    items: Item[]
    label?: string
    placeholder?: string
    allowCreate?: boolean
    createLabel?: string
    title?: string
    variant?: 'default' | 'bordered'
    /** show per-item rename/delete controls (see `rename`/`remove` events) — for "справочник" lists the user manages, not fixed/read-only lists */
    editable?: boolean
    /** bordered variant only: stack the label inside the box (compact caption) instead of
     * above it. Good for a standalone full-width field; leave off when the box sits next to
     * a sibling (FpInput/FpNumberInput/another bordered picker) so their top edges line up. */
    labelInside?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    items: () => [],
    allowCreate: false,
    createLabel: 'Добавить',
    placeholder: 'Поиск...',
    title: 'Выбор',
    variant: 'default',
    editable: false,
    labelInside: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'select', item: Item): void
    (e: 'create', query: string): void
    (e: 'search', query: string): void
    (e: 'rename', payload: { item: Item; name: string }): void
    (e: 'remove', item: Item): void
}>()

const isOverlayOpen = ref(false)
const searchQuery = ref('')

const filteredItems = computed(() => {
    const q = searchQuery.value.toLowerCase()
    if (!q) return props.items
    return props.items.filter(i => i.name.toLowerCase().includes(q))
})

const showCreateOption = computed(() => {
    return props.allowCreate &&
        searchQuery.value.length > 0 &&
        !props.items.find(i => i.name.toLowerCase() === searchQuery.value.toLowerCase())
})

const openPicker = () => {
    searchQuery.value = ''
    isOverlayOpen.value = true
    editingId.value = null
    removeTarget.value = null
    emit('search', '')
}

const closePicker = () => {
    isOverlayOpen.value = false
}

const handleSelect = (item: Item) => {
    emit('update:modelValue', item.name)
    emit('select', item)
    closePicker()
}

const handleCreate = () => {
    emit('create', searchQuery.value)
    closePicker()
}

watch(searchQuery, (q) => {
    emit('search', q)
})

// Rename an item in place (own line, not a select) — a "справочник" the user manages
// themselves (categories, author/publisher/…), not a fixed config list. Delete goes through
// a real FpConfirmationModal instead (see `removeTarget` below) — an inline "Удалить X?"
// row felt off, deletion is destructive enough to warrant an actual dialog.
const editingId = ref<string | number | null>(null)
const editingValue = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

const isManageable = (item: Item) => props.editable && item.id !== '' && item.id != null

const startEdit = async (item: Item) => {
    editingId.value = item.id
    editingValue.value = item.name
    await nextTick()
    editInputRef.value?.focus()
}
const cancelEdit = () => {
    editingId.value = null
}
const confirmEdit = (item: Item) => {
    const name = editingValue.value.trim()
    if (name && name !== item.name) emit('rename', { item, name })
    editingId.value = null
}

const removeTarget = ref<Item | null>(null)
const askRemove = (item: Item) => {
    editingId.value = null
    removeTarget.value = item
}
const confirmRemove = () => {
    if (removeTarget.value) emit('remove', removeTarget.value)
}

// Global hotkeys or back-button prevention can be here
</script>

<template>
    <div class="fp-mobile-picker" :class="[`fp-mobile-picker--${variant}`, { 'is-label-inside': labelInside }]">
        <!-- bordered + !labelInside: label sits above the box, same as
             FpInput(outlined)/FpNumberInput, so box heights and top edges line up when they
             sit side by side in a form row. bordered + labelInside: label stacks inside the
             box (compact caption) — only for a standalone field with no row neighbour. -->
        <span v-if="label && variant === 'bordered' && !labelInside" class="external-label">{{ label }}</span>
        <div class="picker-trigger" @click="openPicker">
            <div v-if="label && (variant !== 'bordered' || labelInside)" class="trigger-label"
                :class="{ 'has-value': modelValue && variant !== 'bordered' }">{{ label }}</div>
            <div class="trigger-value" :class="{ 'is-placeholder': !modelValue }">{{
                modelValue || (variant === 'bordered' ? placeholder : (label ? '' : placeholder)) }}</div>
            <div class="chevron">
                <ChevronDown :size="20" />
            </div>
        </div>

        <Teleport to="body">
            <Transition name="picker-fade">
                <div v-if="isOverlayOpen" class="picker-overlay">
                    <div class="picker-header">
                        <button class="close-btn" @click="closePicker">
                            <X :size="24" />
                        </button>
                        <h2 class="picker-title">{{ title }}</h2>
                        <div style="width: 24px"></div>
                    </div>

                    <div class="picker-search">
                        <FpInput v-model="searchQuery" :placeholder="placeholder" ref="searchInputRef" autofocus />
                    </div>

                    <div class="picker-content">
                        <div v-if="filteredItems.length === 0 && !showCreateOption" class="empty-results">
                            Ничего не найдено
                        </div>

                        <div v-for="item in filteredItems" :key="item.id" class="picker-item"
                            :class="{ 'no-tap': editingId === item.id }">
                            <template v-if="editingId === item.id">
                                <input ref="editInputRef" v-model="editingValue" class="edit-input"
                                    @keydown.enter="confirmEdit(item)" @keydown.esc="cancelEdit" />
                                <button class="row-btn ok" aria-label="Сохранить" @click="confirmEdit(item)">
                                    <Check :size="16" />
                                </button>
                                <button class="row-btn" aria-label="Отмена" @click="cancelEdit">
                                    <X :size="16" />
                                </button>
                            </template>
                            <template v-else>
                                <span class="item-label" @click="handleSelect(item)">{{ item.name }}</span>
                                <span v-if="isManageable(item)" class="row-actions">
                                    <button class="row-btn" aria-label="Переименовать" @click.stop="startEdit(item)">
                                        <Pencil :size="15" />
                                    </button>
                                    <button class="row-btn danger" aria-label="Удалить" @click.stop="askRemove(item)">
                                        <Trash2 :size="15" />
                                    </button>
                                </span>
                            </template>
                        </div>

                        <div v-if="showCreateOption" class="picker-item create-btn" @click="handleCreate">
                            <span class="plus">+</span> {{ createLabel }} "{{ searchQuery }}"
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <FpConfirmationModal :visible="!!removeTarget" title="Удалить?"
            :message="`«${removeTarget?.name}» будет удалено без возможности восстановления.`"
            confirm-text="Удалить" variant="danger" @confirm="confirmRemove"
            @update:visible="v => { if (!v) removeTarget = null }" />
    </div>
</template>

<style scoped lang="scss">
.fp-mobile-picker {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0; // let it shrink inside flex/grid parents instead of forcing overflow
    //margin-bottom: var(--spacing-md);
}

.external-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    padding-left: 2px;
    margin-bottom: 5px;
}

.picker-trigger {
    position: relative;
    align-items: flex-end;
    background-color: var(--color-surface);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    // border-bottom: 2px solid var(--color-border);
    height: 56px;
    padding: 8px 16px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    cursor: pointer;
    transition: all 0.2s;
    overflow: hidden; // the trigger box is the clip boundary — value truncates, never leaks past it
    min-width: 0;

    &:active {
        background-color: color-mix(in srgb, var(--color-primary) 4%, transparent);
        border-bottom-color: var(--color-primary);
    }
}

.trigger-label {
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

.trigger-value {
    display: block;
    width: 100%;
    min-width: 0;
    font-size: var(--text-body-1);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 24px;
    box-sizing: border-box;

    &.is-placeholder {
        color: var(--color-text-disabled);
        font-weight: 400;
    }
}

.chevron {
    position: absolute;
    right: 12px;
    bottom: 12px;
    color: var(--color-text-secondary);
}

.picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-background);
    // above FpModal (3000): the picker is often opened from inside a modal (e.g.
    // AddReminderModal). Below FpConfirmationModal (3800) on purpose — `editable`'s
    // delete confirm renders as a real FpConfirmationModal and must stay on top of us.
    z-index: 3600;
    display: flex;
    flex-direction: column;
}

.picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    ;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
}

.picker-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    padding: 4px;
    color: var(--color-text-primary);
    cursor: pointer;
}

.picker-search {
    padding: 16px;
    background: var(--color-surface);
}

.picker-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 40px;
}

.picker-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border);
    font-size: 1.125rem;
    color: var(--color-text-primary);
    transition: background-color 0.1s;

    &:active:not(.no-tap) {
        background-color: var(--color-surface-hover);
    }

    &.create-btn {
        cursor: pointer;
        color: var(--color-primary);
        font-weight: 600;
        background-color: color-mix(in srgb, var(--color-primary) 2%, transparent);

        .plus {
            font-size: 1.5rem;
            margin-right: 8px;
        }
    }
}

.item-label {
    flex: 1;
    min-width: 0;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.row-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

.row-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;

    &:hover,
    &:active {
        background-color: var(--color-surface-hover);
        color: var(--color-text-primary);
    }

    &.ok {
        color: var(--color-success);

        &:hover,
        &:active {
            background-color: color-mix(in srgb, var(--color-success) 14%, transparent);
            color: var(--color-success);
        }
    }

    &.danger {
        color: var(--color-error);

        &:hover,
        &:active {
            background-color: color-mix(in srgb, var(--color-error) 12%, transparent);
            color: var(--color-error);
        }
    }
}

.edit-input {
    flex: 1;
    min-width: 0;
    font: inherit;
    color: var(--color-text-primary);
    background: var(--color-surface);
    border: 1.5px solid var(--color-primary);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
}

.empty-results {
    padding: 40px;
    text-align: center;
    color: var(--color-text-secondary);
}

// Bordered variant — label lives outside the box (`.external-label`, above), and the box
// itself is a single 44px row: same box model as FpInput(outlined)/FpNumberInput, so a
// bordered picker sitting next to either of those in a form row lines up exactly (same
// top edge, same height) instead of the label-inside-the-box default variant's 48px box.
.fp-mobile-picker--bordered {
    .picker-trigger {
        border: 1.5px solid var(--color-border);
        border-radius: 12px;
        height: 44px;
        padding: 0 12px;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        transition: border-color 0.2s;

        &:active {
            border-color: var(--color-primary);
            background-color: transparent;
        }
    }

    .trigger-value {
        flex: 1 1 auto;
        width: auto;
        font-size: 15px;
        font-weight: 600;
        padding-right: 8px;

        &.is-placeholder {
            font-weight: 400;
        }
    }

    .chevron {
        position: static;
        margin-left: auto;
        flex-shrink: 0;
    }
}

// labelInside: the label goes back inside the box, stacked above the value (like the
// bordered variant looked before the row-alignment fix) — only meant for a standalone
// field with no half-width row neighbour to line up with.
.fp-mobile-picker--bordered.is-label-inside {
    .picker-trigger {
        height: 48px;
        padding: 4px 12px;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 1px;
    }

    .trigger-label {
        position: static;
        font-size: 11px;
        font-weight: 500;
        color: var(--color-text-secondary);
        letter-spacing: 0.01em;
    }

    .trigger-value {
        padding-right: 20px;
    }

    .chevron {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        margin-left: 0;
    }
}

// Transitions
.picker-fade-enter-active,
.picker-fade-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
    transform: translateY(100%);
    opacity: 0;
}
</style>
