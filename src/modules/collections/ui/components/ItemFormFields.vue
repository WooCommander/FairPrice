<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import { FpHaptics } from '@/shared/lib/haptics'
import { useNotify } from '@/composables/useNotify'
import {
	FpInput, FpTextarea, FpMobilePicker, FpTagsInput, FpNumberInput, FpImageUploader,
} from '@/design-system'
import DynamicField from './DynamicField.vue'
import { uploadItemPhotos } from '../../lib/photos'
import { lookupIsbn } from '../../lib/openLibrary'
import { useCategoriesStore } from '../../state/useCategoriesStore'
import { CollectionItemService } from '../../services/CollectionItemService'
import { ITEM_STATUS_LABELS } from '../../domain/CollectionItem'
import type { CollectionItem, CollectionItemInsertDTO } from '../../domain/CollectionItem'
import type { CollectionCategory } from '../../domain/Category'
import type { CollectionTypeConfig } from '../../domain/types'

const props = defineProps<{
	collectionId: string
	type: CollectionTypeConfig
	categories: readonly CollectionCategory[]
	initialData: CollectionItem | null
}>()

const emit = defineEmits<{
	(e: 'save', payload: { id?: string; dto: CollectionItemInsertDTO }): void
}>()

const { notify } = useNotify()
const { addCategory, editCategory, removeCategory } = useCategoriesStore()

const blank = () => ({
	title: '',
	subtitle: '',
	photos: [] as string[], // [0] = cover
	category_id: null as string | null,
	tags: [] as string[],
	quantity: 1 as number,
	location: '',
	status: 'have' as string,
	price: null as number | null,
	notes: '',
	data: {} as Record<string, unknown>,
})

const form = reactive(blank())
const uploading = ref(false)
const saving = ref(false)
const showScanner = ref(false)
const scanTargetKey = ref<string | null>(null)

// snapshot for dirty-checking (see `isDirty`/`markSaved`) — a host page uses this to warn
// before navigating away with unsaved changes. Kept as a plain object (not just a string)
// so a reference-value bulk rename/delete (already persisted server-side — see
// `renameReferenceValue`/`removeReferenceValue`) can re-baseline just that one field
// without hiding other, still-unsaved edits the user made elsewhere in the form.
const snapshot = ref<Record<string, unknown>>({})
const takeSnapshot = () => {
	snapshot.value = JSON.parse(JSON.stringify(form))
}

watch(
	() => props.initialData,
	d => {
		Object.assign(form, blank())
		if (d) {
			Object.assign(form, {
				title: d.title,
				subtitle: d.subtitle ?? '',
				photos: [d.cover_url, ...d.photos].filter(Boolean) as string[],
				category_id: d.category_id,
				tags: [...d.tags],
				quantity: d.quantity ?? 1,
				location: d.location ?? '',
				status: d.status ?? 'have',
				price: d.price,
				notes: d.notes ?? '',
				data: { ...d.data },
			})
		}
		takeSnapshot()
	},
	{ immediate: true },
)
const isDirty = computed(() => JSON.stringify(form) !== JSON.stringify(snapshot.value))

const addPhotos = async (files: File[]) => {
	uploading.value = true
	try {
		const urls = await uploadItemPhotos(files)
		form.photos.push(...urls)
	} catch (err) {
		console.error(err)
		notify('Не удалось загрузить фото', 'error')
	} finally {
		uploading.value = false
	}
}

const openScanner = (key: string) => {
	scanTargetKey.value = key
	showScanner.value = true
}

const onScan = async (code: string) => {
	showScanner.value = false
	const key = scanTargetKey.value
	if (!key) return
	form.data[key] = code

	if (props.type.key === 'books' && key === 'isbn') {
		notify('Ищем книгу по ISBN…', 'info', 1500)
		const found = await lookupIsbn(code)
		if (found) {
			if (found.title && !form.title) form.title = found.title
			if (found.author && !form.subtitle) form.subtitle = found.author
			if (found.publisher && !form.data.publisher) form.data.publisher = found.publisher
			if (found.year && !form.data.year) form.data.year = found.year
			if (found.coverUrl && !form.photos.length) form.photos.push(found.coverUrl)
			notify('Данные подставлены', 'success')
		} else {
			notify('Книга не найдена, заполни вручную', 'warning')
		}
	}
}

// Category & status are "справочники" (reference lists) — picked via the same
// full-screen searchable picker used across the app for category/store/unit (see
// CreateProductView / AddPriceView), instead of a plain <select>-style dropdown.
const categoryItems = computed(() => [
	{ id: '', name: 'Без категории' },
	...props.categories.map(c => ({ id: c.id, name: c.name })),
])
const categoryDisplay = computed(
	() => props.categories.find(c => c.id === form.category_id)?.name ?? 'Без категории',
)
const setCategory = (item: { id: string | number }) => {
	form.category_id = item.id ? String(item.id) : null
}
const createCategory = async (name: string) => {
	if (!name.trim()) return
	try {
		const created = await addCategory(props.collectionId, name.trim())
		form.category_id = created.id
	} catch (err: any) {
		notify(err.message || 'Не удалось создать категорию', 'error')
	}
}
const renameCategory = async ({ item, name }: { item: { id: string | number }; name: string }) => {
	if (!item.id) return
	try {
		await editCategory(String(item.id), { name })
	} catch (err: any) {
		notify(err.message || 'Не удалось переименовать категорию', 'error')
	}
}
const deleteCategoryEntry = async (item: { id: string | number }) => {
	if (!item.id) return
	try {
		await removeCategory(String(item.id))
		if (form.category_id === String(item.id)) {
			form.category_id = null
			snapshot.value.category_id = null
		}
	} catch (err: any) {
		notify(err.message || 'Не удалось удалить категорию', 'error')
	}
}

const statusItems = computed(() =>
	Object.entries(ITEM_STATUS_LABELS).map(([id, name]) => ({ id, name })),
)
const statusDisplay = computed(() => ITEM_STATUS_LABELS[form.status] ?? form.status)
const setStatus = (item: { id: string | number }) => {
	form.status = String(item.id)
}

// "reference" fields (see FieldType) — including the built-in subtitle when
// `subtitleAsReference` — suggest values already used elsewhere in this collection
// instead of a fixed config list, e.g. author/publisher/illustrator for books.
const referenceKeys = computed(() => {
	const keys = props.type.fields.filter(f => f.type === 'reference').map(f => f.key)
	if (props.type.subtitleAsReference) keys.push('subtitle')
	return keys
})
const referenceValues = ref<Record<string, string[]>>({})
const refreshReferenceValues = async () => {
	if (!referenceKeys.value.length) {
		referenceValues.value = {}
		return
	}
	try {
		referenceValues.value = await CollectionItemService.fetchDistinctFieldValues(
			props.collectionId,
			referenceKeys.value,
		)
	} catch (err) {
		console.error(err)
	}
}
watch(() => [props.collectionId, referenceKeys.value.join(',')] as const, refreshReferenceValues, {
	immediate: true,
})
const subtitleItems = computed(
	() => (referenceValues.value.subtitle ?? []).map(v => ({ id: v, name: v })),
)

// rename/delete a reference value everywhere it's used in this collection (not just the
// item currently open) — see CollectionItemService.bulkSetFieldValue
const renameReferenceValue = async (key: string, oldValue: string, newValue: string) => {
	try {
		const count = await CollectionItemService.bulkSetFieldValue(props.collectionId, key, oldValue, newValue)
		// already persisted for every item that had it (including this one, if it did) —
		// mirror it in the open form and re-baseline just this field so it isn't flagged
		// as an unsaved edit, without hiding other still-unsaved edits in the form
		if (key === 'subtitle' && form.subtitle === oldValue) {
			form.subtitle = newValue
			snapshot.value.subtitle = newValue
		}
		if (key !== 'subtitle' && form.data[key] === oldValue) {
			form.data[key] = newValue
			;(snapshot.value.data as Record<string, unknown>)[key] = newValue
		}
		await refreshReferenceValues()
		notify(count ? `Переименовано в ${count} элементах` : 'Переименовано', 'success')
	} catch (err: any) {
		notify(err.message || 'Не удалось переименовать', 'error')
	}
}
const removeReferenceValue = async (key: string, value: string) => {
	try {
		const count = await CollectionItemService.bulkSetFieldValue(props.collectionId, key, value, null)
		if (key === 'subtitle' && form.subtitle === value) {
			form.subtitle = ''
			snapshot.value.subtitle = ''
		}
		if (key !== 'subtitle' && form.data[key] === value) {
			delete form.data[key]
			delete (snapshot.value.data as Record<string, unknown>)[key]
		}
		await refreshReferenceValues()
		notify(count ? `Удалено из ${count} элементов` : 'Удалено', 'success')
	} catch (err: any) {
		notify(err.message || 'Не удалось удалить', 'error')
	}
}

const submit = () => {
	if (!form.title.trim()) {
		notify('Укажи название', 'warning')
		return
	}
	FpHaptics.selection()
	saving.value = true

	const cleanData: Record<string, unknown> = {}
	for (const [k, v] of Object.entries(form.data)) {
		if (v !== undefined && v !== '' && v !== null) cleanData[k] = v
	}

	const dto: CollectionItemInsertDTO = {
		collection_id: props.collectionId,
		title: form.title.trim(),
		subtitle: form.subtitle.trim() || null,
		cover_url: form.photos[0] ?? null,
		photos: form.photos.slice(1),
		category_id: form.category_id,
		tags: form.tags,
		quantity: Number(form.quantity) || 1,
		location: form.location.trim() || null,
		status: form.status || null,
		price: form.status === 'for_sale' ? form.price : null,
		notes: form.notes.trim() || null,
		data: cleanData,
	}

	try {
		emit('save', { id: props.initialData?.id, dto })
	} finally {
		saving.value = false
	}
}

defineExpose({ submit, saving, uploading, isDirty, markSaved: takeSnapshot })
</script>

<template>
	<div class="form">
		<FpImageUploader v-model="form.photos" label="Фото" cover-first :uploading="uploading"
			@add="addPhotos" />

		<FpInput variant="outlined" v-model="form.title" label="Название" :placeholder="type.titleHint" />

		<FpMobilePicker v-if="type.subtitleHint && type.subtitleAsReference" :model-value="form.subtitle"
			:label="type.subtitleHint" :items="subtitleItems" :title="type.subtitleHint" placeholder="—"
			variant="bordered" allow-create create-label="Добавить" editable @select="form.subtitle = String($event.id)"
			@create="form.subtitle = $event"
			@rename="renameReferenceValue('subtitle', String($event.item.name), $event.name)"
			@remove="removeReferenceValue('subtitle', String($event.name))" />
		<FpInput v-else-if="type.subtitleHint" variant="outlined" v-model="form.subtitle"
			:label="type.subtitleHint" :placeholder="type.subtitleHint" />

		<div class="grid">
			<DynamicField v-for="f in type.fields" :key="f.key" :spec="f" v-model="form.data[f.key]"
				:reference-items="referenceValues[f.key]" @scan="openScanner(f.key)"
				@reference-rename="renameReferenceValue($event.key, $event.oldValue, $event.newValue)"
				@reference-remove="removeReferenceValue($event.key, $event.value)" />
		</div>

		<FpMobilePicker :model-value="categoryDisplay" label="Категория" :items="categoryItems"
			title="Выбор категории" variant="bordered" allow-create create-label="Добавить категорию" editable
			@select="setCategory" @create="createCategory" @rename="renameCategory" @remove="deleteCategoryEntry" />

		<FpTagsInput v-model="form.tags" label="Теги" />

		<div class="grid">
			<div class="half">
				<FpNumberInput v-model="form.quantity" label="Количество" :min="0" />
			</div>
			<div class="half">
				<FpInput variant="outlined" v-model="form.location" label="Где лежит"
					placeholder="полка, коробка…" />
			</div>
		</div>

		<div class="grid">
			<div class="half">
				<FpMobilePicker :model-value="statusDisplay" label="Статус" :items="statusItems"
					title="Статус" variant="bordered" @select="setStatus" />
			</div>
			<div v-if="form.status === 'for_sale'" class="half">
				<FpNumberInput :model-value="form.price ?? ''" label="Цена" :min="0" :step="0.01"
					@update:model-value="form.price = $event" />
			</div>
		</div>

		<FpTextarea v-model="form.notes" label="Заметки" :rows="2"
			placeholder="состояние, кому одолжил…" />
	</div>

	<BarcodeScanner v-if="showScanner" @scan="onScan" @close="showScanner = false" />
</template>

<style scoped lang="scss">
.form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.grid {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.half {
	flex: 1 1 calc(50% - 6px);
	min-width: 140px;
}
</style>
