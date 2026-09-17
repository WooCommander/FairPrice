<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft, Plus, Trash2, Search, BookOpen } from 'lucide-vue-next'
import FpButton from '@/design-system/components/FpButton.vue'
import FpInput from '@/design-system/components/FpInput.vue'
import FpNumberInput from '@/design-system/components/FpNumberInput.vue'
import FpCombobox, { type ComboboxItem } from '@/design-system/components/FpCombobox.vue'
import FpMobilePicker from '@/design-system/components/FpMobilePicker.vue'
import { useNotify } from '@/composables/useNotify'
import FpCard from '@/design-system/components/FpCard.vue'
import FpConfirmationModal from '@/design-system/components/FpConfirmationModal.vue'
import FpModal from '@/design-system/components/FpModal.vue'
import FpIconButton from '@/design-system/components/FpIconButton.vue'
import FpFab from '@/design-system/components/FpFab.vue'
import FpEmptyState from '@/design-system/components/FpEmptyState.vue'
import FpSelect from '@/design-system/components/FpSelect.vue'
import FpTextarea from '@/design-system/components/FpTextarea.vue'
import FpTagsInput from '@/design-system/components/FpTagsInput.vue'
import FpSearchInput from '@/design-system/components/FpSearchInput.vue'
import FpChip from '@/design-system/components/FpChip.vue'
import FpImageUploader from '@/design-system/components/FpImageUploader.vue'
import FpSwitch from '@/design-system/components/FpSwitch.vue'

const { notify } = useNotify()

// Button demo
const btnLoading = ref(false)
const toggleLoading = () => btnLoading.value = !btnLoading.value

// Input demo
const textVal = ref('')
const numberVal = ref('')
const errorVal = ref('Invalid input')
const outlinedVal = ref('')

// NumberInput demo
const numVal1 = ref(1)
const numVal2 = ref(0.5)
const numVal3 = ref(5)

// Mobile Picker demo
const pickerPublisherValue = ref('')
const pickerPublisherItems = ref([
    { id: 'eksmo', name: 'Эксмо' },
    { id: 'azbuka', name: 'Азбука' },
])
const pickerDefaultValue = ref('Проза')
const pickerGenreItems = ref([
    { id: 'fiction', name: 'Проза' },
    { id: 'scifi', name: 'Фантастика' },
    { id: 'history', name: 'История' },
])
const pickerCityValue = ref('Москва')
const pickerCityItems = ref([
    { id: 'moscow', name: 'Москва' },
    { id: 'spb', name: 'Санкт-Петербург' },
])
const pickerYearDemo = ref(1988)
// editable = an opt-in prop (default false) that turns a справочник's list into one the
// user can rename/delete from in place — off unless a picker's list is actually a
// user-managed dictionary (categories, author/publisher/…), not a fixed config list
const pickerAuthorValue = ref('А.С. Пушкин')
const pickerAuthorItems = ref([
    { id: 'pushkin', name: 'А.С. Пушкин' },
    { id: 'tolstoy', name: 'Л.Н. Толстой' },
])
const onPickerAuthorCreate = (name: string) => {
    if (!name.trim()) return
    pickerAuthorItems.value.push({ id: name.trim(), name: name.trim() })
    pickerAuthorValue.value = name.trim()
}
const onPickerAuthorRename = ({ item, name }: { item: { id: string | number; name: string }; name: string }) => {
    const found = pickerAuthorItems.value.find(i => i.id === item.id)
    if (!found) return
    if (pickerAuthorValue.value === found.name) pickerAuthorValue.value = name
    found.name = name
}
const onPickerAuthorRemove = (item: { id: string | number; name: string }) => {
    pickerAuthorItems.value = pickerAuthorItems.value.filter(i => i.id !== item.id)
    if (pickerAuthorValue.value === item.name) pickerAuthorValue.value = ''
}

// Combobox demo
const comboVal = ref('')
const comboItems = ref<ComboboxItem[]>([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Cherry' },
    { id: 4, name: 'Date' }
])

const handleCreate = (val: string) => {
    notify(`Create: ${val}`, 'info')
}

// ConfirmationModal demo
const modalVisible = ref(false)
const modalDangerVisible = ref(false)

// --- New components demo ---
const contentModalVisible = ref(false)
const selectVal = ref<string | number | null>(null)
const selectOptions = [
    { value: 'have', label: 'В наличии' },
    { value: 'for_sale', label: 'На продажу' },
    { value: 'wanted', label: 'Хочу купить' },
]
const textareaVal = ref('')
const tagsVal = ref<string[]>(['фантастика', 'подарок'])
const searchVal = ref('')
const activeChip = ref('all')
const chips = [
    { key: 'all', label: 'Все', color: null as string | null },
    { key: 'fiction', label: 'Проза', color: '#86efac' },
    { key: 'sci', label: 'Фантастика', color: '#93c5fd' },
    { key: 'hist', label: 'История', color: '#fca5a5' },
]
const removableTags = ref(['один', 'два', 'три'])
const switch1 = ref(true)
const switch2 = ref(false)
const photos = ref<string[]>([])
const photoUploading = ref(false)
const onAddPhotos = (files: File[]) => {
    photoUploading.value = true
    setTimeout(() => {
        photos.value.push(...files.map(f => URL.createObjectURL(f)))
        photoUploading.value = false
    }, 600)
}
</script>

<template>
    <div class="design-system-view">
        <header class="ds-header">
            <h1>Design System</h1>
            <p>Component showcase</p>
        </header>

        <section class="ds-section">
            <h2>Buttons</h2>
            <div class="ds-grid">
                <FpCard>
                    <h3>Variants</h3>
                    <div class="row">
                        <FpButton variant="primary">Primary</FpButton>
                        <FpButton variant="secondary">Secondary</FpButton>
                        <FpButton variant="outline">Outline</FpButton>
                        <FpButton variant="danger">Danger</FpButton>
                    </div>
                </FpCard>
                <FpCard>
                    <h3>Sizes</h3>
                    <div class="row">
                        <FpButton size="sm">Small</FpButton>
                        <FpButton size="md">Medium</FpButton>
                        <FpButton size="lg">Large</FpButton>
                    </div>
                </FpCard>
                <FpCard>
                    <h3>States</h3>
                    <div class="row">
                        <FpButton disabled>Disabled</FpButton>
                        <FpButton :loading="btnLoading" @click="toggleLoading">
                            {{ btnLoading ? 'Loading...' : 'Click to Load' }}
                        </FpButton>
                    </div>
                </FpCard>
            </div>
        </section>

        <section class="ds-section">
            <h2>Icon Button</h2>
            <FpCard>
                <div class="row">
                    <FpIconButton variant="ghost" label="back"><ArrowLeft :size="20" /></FpIconButton>
                    <FpIconButton variant="surface" round label="back"><ArrowLeft :size="20" /></FpIconButton>
                    <FpIconButton variant="primary" label="add"><Plus :size="20" /></FpIconButton>
                    <FpIconButton variant="danger" label="delete"><Trash2 :size="18" /></FpIconButton>
                    <FpIconButton variant="surface" size="sm" label="s"><Search :size="16" /></FpIconButton>
                    <FpIconButton variant="surface" size="lg" label="l"><Search :size="22" /></FpIconButton>
                </div>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Inputs</h2>
            <div class="ds-grid">
                <FpCard>
                    <FpInput v-model="textVal" label="Text Input" placeholder="Type something..." />
                    <p>Value: {{ textVal }}</p>
                </FpCard>

                <FpCard>
                    <FpInput v-model="numberVal" label="Number Input" type="number" />
                </FpCard>

                <FpCard>
                    <FpInput v-model="errorVal" label="Error State" error="This field is required" />
                </FpCard>

                <FpCard>
                    <FpInput v-model="outlinedVal" variant="outlined" label="Outlined variant"
                        placeholder="bordered box + top label" />
                </FpCard>
            </div>
        </section>

        <section class="ds-section">
            <h2>Number Input</h2>
            <div class="ds-grid">
                <FpCard>
                    <FpNumberInput v-model="numVal1" label="Количество (целые)" :min="1" :max="99" />
                    <p style="margin-top: 8px; font-size: 13px; color: var(--color-text-secondary)">Значение: {{ numVal1 }}</p>
                </FpCard>
                <FpCard>
                    <FpNumberInput v-model="numVal2" label="Дробное (шаг 0.1)" :min="0" :max="10" :step="0.1" />
                    <p style="margin-top: 8px; font-size: 13px; color: var(--color-text-secondary)">Значение: {{ numVal2 }}</p>
                </FpCard>
                <FpCard>
                    <FpNumberInput v-model="numVal3" label="Заблокировано" :min="1" :max="10" disabled />
                </FpCard>
            </div>
        </section>

        <section class="ds-section">
            <h2>Mobile Picker</h2>
            <div class="ds-grid">
                <FpCard>
                    <h3>Default variant</h3>
                    <FpMobilePicker v-model="pickerDefaultValue" label="Категория" :items="pickerGenreItems"
                        title="Выбор категории" allow-create @create="pickerDefaultValue = $event" />
                    <p style="margin-top: 8px; font-size: 13px; color: var(--color-text-secondary)">Значение: {{ pickerDefaultValue }}</p>
                </FpCard>

                <FpCard>
                    <h3>Bordered variant</h3>
                    <p style="margin-bottom: 8px; font-size: 13px; color: var(--color-text-secondary)">
                        Same box model as FpInput(outlined)/FpNumberInput — label above, 44px box — so it lines up
                        exactly when paired in a half/half row.
                    </p>
                    <div class="row" style="flex-wrap: nowrap">
                        <div style="flex: 1">
                            <FpMobilePicker v-model="pickerCityValue" label="Город" :items="pickerCityItems"
                                title="Выбор города" variant="bordered" allow-create
                                @create="pickerCityValue = $event" />
                        </div>
                        <div style="flex: 1">
                            <FpNumberInput v-model="pickerYearDemo" label="Год" :min="0" />
                        </div>
                    </div>
                </FpCard>

                <FpCard>
                    <h3>Empty state + labelInside</h3>
                    <p style="margin-bottom: 8px; font-size: 13px; color: var(--color-text-secondary)">
                        With no value picked, the placeholder shows inside the box itself (not just the label
                        above). <code>label-inside</code> stacks the label inside the box too — for a standalone
                        field with no half-width row neighbour to line up with.
                    </p>
                    <FpMobilePicker v-model="pickerPublisherValue" label="Издательство"
                        :items="pickerPublisherItems" title="Выбор издательства" variant="bordered" label-inside
                        placeholder="—" allow-create @create="pickerPublisherValue = $event" />
                </FpCard>

                <FpCard>
                    <h3>Editable (справочник)</h3>
                    <p style="margin-bottom: 8px; font-size: 13px; color: var(--color-text-secondary)">
                        <code>editable</code> — opt-in, default off. Adds rename/delete to each row for lists the
                        user manages themselves (categories, author/publisher/…), not a fixed config list.
                    </p>
                    <FpMobilePicker v-model="pickerAuthorValue" label="Автор" :items="pickerAuthorItems"
                        title="Автор" variant="bordered" editable allow-create create-label="Добавить"
                        @create="onPickerAuthorCreate" @rename="onPickerAuthorRename"
                        @remove="onPickerAuthorRemove" />
                    <p style="margin-top: 8px; font-size: 13px; color: var(--color-text-secondary)">
                        Значение: {{ pickerAuthorValue || '—' }} · в списке: {{ pickerAuthorItems.map(i => i.name).join(', ') || '—' }}
                    </p>
                </FpCard>
            </div>
        </section>

        <section class="ds-section">
            <h2>Select</h2>
            <FpCard>
                <FpSelect v-model="selectVal" label="Статус" placeholder="Выберите…" :options="selectOptions" />
                <p>Selected: {{ selectVal }}</p>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Textarea</h2>
            <FpCard>
                <FpTextarea v-model="textareaVal" label="Заметки" :rows="3" placeholder="состояние, кому одолжил…" />
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Tags Input</h2>
            <FpCard>
                <FpTagsInput v-model="tagsVal" label="Теги" />
                <p>{{ tagsVal }}</p>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Search Input</h2>
            <FpCard>
                <FpSearchInput v-model="searchVal" placeholder="Поиск: книги" />
                <p>Query: "{{ searchVal }}"</p>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Chip</h2>
            <FpCard>
                <div class="row">
                    <FpChip v-for="c in chips" :key="c.key" :active="activeChip === c.key" :color="c.color"
                        @click="activeChip = c.key">
                        {{ c.label }}
                    </FpChip>
                </div>
                <div class="row" style="margin-top: 12px">
                    <FpChip v-for="(t, i) in removableTags" :key="t" static removable
                        @remove="removableTags.splice(i, 1)">
                        {{ t }}
                    </FpChip>
                </div>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Switch</h2>
            <FpCard>
                <FpSwitch v-model="switch1" label="Показывать блок" description="Вкл/выкл на главной" />
                <FpSwitch v-model="switch2" label="Без описания" style="margin-top: 12px" />
                <FpSwitch :model-value="true" label="Заблокирован" disabled style="margin-top: 12px" />
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Combobox</h2>
            <FpCard>
                <FpCombobox v-model="comboVal" :items="comboItems" label="Fruit Selector" placeholder="Select a fruit"
                    allow-create @create="handleCreate" />
                <p>Selected: {{ comboVal }}</p>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Image Uploader</h2>
            <FpCard>
                <FpImageUploader v-model="photos" label="Фото" cover-first :uploading="photoUploading"
                    @add="onAddPhotos" />
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Empty State</h2>
            <FpCard padding="none">
                <FpEmptyState title="Пока нет каталогов" description="Создай первый — например, домашнюю библиотеку.">
                    <template #icon><BookOpen :size="44" /></template>
                    <FpButton size="sm">Создать</FpButton>
                </FpEmptyState>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Modal</h2>
            <FpCard>
                <FpButton @click="contentModalVisible = true">Открыть модалку</FpButton>
                <FpModal v-model:visible="contentModalVisible" title="Пример модалки">
                    <div style="display: flex; flex-direction: column; gap: 14px">
                        <FpInput variant="outlined" model-value="" label="Название" placeholder="…" />
                        <FpTextarea model-value="" label="Описание" :rows="3" />
                    </div>
                    <template #footer>
                        <FpButton variant="text" size="full" @click="contentModalVisible = false">Отмена</FpButton>
                        <FpButton variant="primary" size="full" @click="contentModalVisible = false">Сохранить</FpButton>
                    </template>
                </FpModal>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Confirmation Modal</h2>
            <div class="ds-grid">
                <FpCard>
                    <div class="row">
                        <FpButton variant="primary" @click="modalVisible = true">Открыть (primary)</FpButton>
                        <FpButton variant="danger" @click="modalDangerVisible = true">Открыть (danger)</FpButton>
                    </div>
                </FpCard>
            </div>

            <FpConfirmationModal v-model:visible="modalVisible" title="Подтвердите действие"
                message="Вы уверены, что хотите выполнить это действие?" confirm-text="Подтвердить" />

            <FpConfirmationModal v-model:visible="modalDangerVisible" title="Удалить запись?"
                message="Это действие необратимо. Данные будут удалены навсегда." confirm-text="Удалить"
                variant="danger" />
        </section>

        <section class="ds-section">
            <h2>Cards</h2>
            <div class="ds-grid">
                <FpCard padding="none">Padding: None</FpCard>
                <FpCard padding="sm">Padding: Small</FpCard>
                <FpCard padding="md">Padding: Medium</FpCard>
                <FpCard padding="lg">Padding: Large</FpCard>
                <FpCard flat>Flat Card</FpCard>
            </div>
        </section>

        <section class="ds-section">
            <h2>FAB</h2>
            <FpCard>
                <p style="color: var(--color-text-secondary)">Плавающая кнопка закреплена в правом нижнем углу экрана ↘</p>
            </FpCard>
        </section>

        <FpFab label="Пример FAB">
            <Plus :size="26" :stroke-width="3" />
        </FpFab>
    </div>
</template>

<style scoped lang="scss">
.design-system-view {
    // max-width: 800px;
    //
    padding: var(--spacing-sm);
    padding-bottom: 120px;
}

.ds-header {
    margin-bottom: var(--spacing-xl);
    text-align: center;
}

.ds-section {
    margin-bottom: var(--spacing-xl);

    h2 {
        margin-bottom: var(--spacing-md);
        border-bottom: 2px solid var(--color-border);
        padding-bottom: 8px;
    }
}

.ds-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.row {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    align-items: center;
}
</style>
