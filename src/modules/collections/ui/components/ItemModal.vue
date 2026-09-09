<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import BarcodeScanner from '@/components/BarcodeScanner.vue'
import { FpHaptics } from '@/shared/lib/haptics'
import { useNotify } from '@/composables/useNotify'
import {
	FpModal, FpButton, FpInput, FpTextarea, FpSelect, FpTagsInput, FpNumberInput, FpImageUploader,
} from '@/design-system'
import DynamicField from './DynamicField.vue'
import { uploadItemPhotos } from '../../lib/photos'
import { lookupIsbn } from '../../lib/openLibrary'
import { ITEM_STATUS_LABELS } from '../../domain/CollectionItem'
import type { CollectionItem, CollectionItemInsertDTO } from '../../domain/CollectionItem'
import type { CollectionCategory } from '../../domain/Category'
import type { CollectionTypeConfig } from '../../domain/types'

const props = defineProps<{
	visible: boolean
	collectionId: string
	type: CollectionTypeConfig
	categories: readonly CollectionCategory[]
	initialData: CollectionItem | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'save', payload: { id?: string; dto: CollectionItemInsertDTO }): void
}>()

const { notify } = useNotify()

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

const isEdit = computed(() => !!props.initialData)

const statusOptions = computed(() =>
	Object.entries(ITEM_STATUS_LABELS).map(([value, label]) => ({ value, label })),
)
const categoryOptions = computed(() => [
	{ value: '', label: 'Без категории' },
	...props.categories.map(c => ({ value: c.id, label: c.name })),
])

watch(
	() => [props.visible, props.initialData] as const,
	([visible]) => {
		if (!visible) return
		Object.assign(form, blank())
		const d = props.initialData
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
	},
	{ immediate: true },
)

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
			if (found.author && !form.data.author) form.data.author = found.author
			if (found.publisher && !form.data.publisher) form.data.publisher = found.publisher
			if (found.year && !form.data.year) form.data.year = found.year
			if (found.coverUrl && !form.photos.length) form.photos.push(found.coverUrl)
			notify('Данные подставлены', 'success')
		} else {
			notify('Книга не найдена, заполни вручную', 'warning')
		}
	}
}

const setCategory = (v: string | number | null) => {
	form.category_id = v ? String(v) : null
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
</script>

<template>
	<FpModal :visible="visible" :title="isEdit ? 'Редактировать' : `Добавить: ${type.itemLabel}`"
		@update:visible="!$event && emit('close')" @close="emit('close')">
		<div class="form">
			<FpImageUploader v-model="form.photos" label="Фото" cover-first :uploading="uploading"
				@add="addPhotos" />

			<FpInput variant="outlined" v-model="form.title" label="Название" :placeholder="type.titleHint" />

			<FpInput v-if="type.subtitleHint" variant="outlined" v-model="form.subtitle"
				:label="type.subtitleHint" :placeholder="type.subtitleHint" />

			<div class="grid">
				<DynamicField v-for="f in type.fields" :key="f.key" :spec="f" v-model="form.data[f.key]"
					@scan="openScanner(f.key)" />
			</div>

			<FpSelect :model-value="form.category_id ?? ''" label="Категория" :options="categoryOptions"
				@update:model-value="setCategory" />

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
					<FpSelect v-model="form.status" label="Статус" :options="statusOptions" />
				</div>
				<div v-if="form.status === 'for_sale'" class="half">
					<FpNumberInput :model-value="form.price ?? ''" label="Цена" :min="0" :step="0.01"
						@update:model-value="form.price = $event" />
				</div>
			</div>

			<FpTextarea v-model="form.notes" label="Заметки" :rows="2"
				placeholder="состояние, кому одолжил…" />
		</div>

		<template #footer>
			<FpButton variant="text" size="full" @click="emit('close')">Отмена</FpButton>
			<FpButton variant="primary" size="full" :loading="saving" :disabled="uploading" @click="submit">
				{{ isEdit ? 'Сохранить' : 'Добавить' }}
			</FpButton>
		</template>
	</FpModal>

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
