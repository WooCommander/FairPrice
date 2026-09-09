<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Share2, Pencil, Trash2, ImageOff } from 'lucide-vue-next'
import { FpHaptics } from '@/shared/lib/haptics'
import { useNotify } from '@/composables/useNotify'
import { FpButton, FpChip, FpConfirmationModal, FpIconButton, FpSpinner } from '@/design-system'
import { useCollectionsStore } from '../state/useCollectionsStore'
import { useCollectionItemsStore } from '../state/useCollectionItemsStore'
import { useCategoriesStore } from '../state/useCategoriesStore'
import { CollectionService } from '../services/CollectionService'
import { CollectionItemService } from '../services/CollectionItemService'
import { getCollectionType } from '../config'
import { shareItem } from '../lib/share'
import { ITEM_STATUS_LABELS } from '../domain/CollectionItem'
import ItemModal from './components/ItemModal.vue'
import type { Collection } from '../domain/Collection'
import type { CollectionItem, CollectionItemInsertDTO } from '../domain/CollectionItem'

const route = useRoute()
const router = useRouter()
const { notify } = useNotify()

const collectionsStore = useCollectionsStore()
const itemsStore = useCollectionItemsStore()
const categoriesStore = useCategoriesStore()

const collectionId = computed(() => String(route.params.id))
const itemId = computed(() => String(route.params.itemId))

const collection = ref<Collection | null>(null)
const item = ref<CollectionItem | null>(null)
const loading = ref(true)

const showEdit = ref(false)
const showDelete = ref(false)
const sharing = ref(false)

const type = computed(() => getCollectionType(collection.value?.type))
const canEdit = computed(
	() => collection.value?.is_owner || collection.value?.my_role === 'editor',
)

const photos = computed(() => {
	const it = item.value
	if (!it) return [] as string[]
	return [it.cover_url, ...it.photos].filter(Boolean) as string[]
})
const activePhoto = ref(0)

const category = computed(() =>
	item.value?.category_id ? categoriesStore.getById(item.value.category_id) : null,
)

const fieldRows = computed(() => {
	const it = item.value
	if (!it) return []
	return type.value.fields
		.map(f => ({ label: f.label, value: it.data[f.key] }))
		.filter(r => r.value !== undefined && r.value !== null && r.value !== '')
})

const statusLabel = computed(() => {
	const s = item.value?.status
	return s && s !== 'have' ? ITEM_STATUS_LABELS[s] ?? s : null
})

const load = async () => {
	loading.value = true
	activePhoto.value = 0
	collection.value =
		collectionsStore.getById(collectionId.value) ??
		(await CollectionService.getCollection(collectionId.value))
	if (!collection.value) {
		notify('Каталог не найден', 'error')
		router.replace('/collections')
		return
	}
	await categoriesStore.load(collectionId.value)
	item.value = await CollectionItemService.getItem(itemId.value)
	loading.value = false
	if (!item.value) {
		notify('Элемент не найден', 'error')
		router.replace(`/collections/${collectionId.value}`)
	}
}

onMounted(load)
watch(itemId, load)

const doShare = async () => {
	if (!item.value) return
	sharing.value = true
	FpHaptics.light()
	try {
		const res = await shareItem(item.value, type.value, collection.value?.name)
		if (res.method === 'clipboard') notify('Скопировано в буфер обмена', 'success')
		else if (res.method === 'failed') notify('Не удалось поделиться', 'error')
	} finally {
		sharing.value = false
	}
}

const handleSave = async ({ id, dto }: { id?: string; dto: CollectionItemInsertDTO }) => {
	if (!id) return
	try {
		const { collection_id, ...updates } = dto
		void collection_id
		item.value = await itemsStore.editItem(id, updates)
		showEdit.value = false
		notify('Сохранено', 'success')
	} catch (e: any) {
		notify(e.message || 'Ошибка сохранения', 'error')
	}
}

const confirmDelete = async () => {
	if (!item.value) return
	try {
		await itemsStore.removeItem(item.value.id)
		FpHaptics.success()
		router.replace(`/collections/${collectionId.value}`)
	} catch (e: any) {
		notify(e.message || 'Не удалось удалить', 'error')
	}
}
</script>

<template>
	<div class="item-view">
		<header class="bar">
			<FpIconButton variant="surface" round label="Назад"
				@click="router.push(`/collections/${collectionId}`)">
				<ArrowLeft :size="22" />
			</FpIconButton>
			<div class="bar-spacer" />
			<FpIconButton variant="surface" round label="Поделиться" :disabled="sharing || loading"
				@click="doShare">
				<Share2 :size="18" />
			</FpIconButton>
			<FpIconButton v-if="canEdit" variant="surface" round label="Редактировать"
				@click="showEdit = true">
				<Pencil :size="18" />
			</FpIconButton>
			<FpIconButton v-if="canEdit" variant="danger" round label="Удалить" @click="showDelete = true">
				<Trash2 :size="18" />
			</FpIconButton>
		</header>

		<div v-if="loading" class="loading"><FpSpinner size="md" /></div>

		<template v-else-if="item">
			<div class="gallery">
				<div class="gallery-main">
					<img v-if="photos[activePhoto]" :src="photos[activePhoto]" :alt="item.title" />
					<ImageOff v-else :size="40" class="ph" />
				</div>
				<div v-if="photos.length > 1" class="gallery-strip">
					<button v-for="(p, i) in photos" :key="p" class="thumb" :class="{ active: i === activePhoto }"
						@click="activePhoto = i">
						<img :src="p" alt="" />
					</button>
				</div>
			</div>

			<div class="head">
				<h1 class="title">{{ item.title }}</h1>
				<p v-if="item.subtitle" class="subtitle">{{ item.subtitle }}</p>
				<div class="badges">
					<FpChip v-if="category" static :active="!!category" :color="category.color">
						{{ category.name }}
					</FpChip>
					<FpChip v-if="statusLabel" static>{{ statusLabel }}</FpChip>
					<FpChip v-if="item.status === 'for_sale' && item.price" static>Цена: {{ item.price }}</FpChip>
				</div>
			</div>

			<dl v-if="fieldRows.length" class="facts">
				<div v-for="row in fieldRows" :key="row.label" class="fact">
					<dt>{{ row.label }}</dt>
					<dd>{{ row.value }}</dd>
				</div>
			</dl>

			<dl class="facts">
				<div class="fact">
					<dt>Экземпляров</dt>
					<dd>{{ item.quantity }}</dd>
				</div>
				<div v-if="item.location" class="fact">
					<dt>Где лежит</dt>
					<dd>{{ item.location }}</dd>
				</div>
			</dl>

			<div v-if="item.tags.length" class="tags">
				<FpChip v-for="t in item.tags" :key="t" static>#{{ t }}</FpChip>
			</div>

			<div v-if="item.notes" class="notes">
				<span class="notes-label">Заметки</span>
				<p>{{ item.notes }}</p>
			</div>

			<FpButton variant="outline" size="full" :loading="sharing" @click="doShare">
				<Share2 :size="18" style="margin-right: 8px" /> Поделиться
			</FpButton>
		</template>

		<ItemModal v-if="item && canEdit" :visible="showEdit" :collection-id="collectionId" :type="type"
			:categories="categoriesStore.categories.value" :initial-data="item"
			@close="showEdit = false" @save="handleSave" />

		<FpConfirmationModal v-model:visible="showDelete" title="Удалить элемент?"
			:message="`«${item?.title}» будет удалён без возможности восстановления.`"
			confirm-text="Удалить" variant="danger" @confirm="confirmDelete" />
	</div>
</template>

<style scoped lang="scss">
.item-view {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding: var(--spacing-md);
	padding-bottom: 100px;
	max-width: 640px;
	margin: 0 auto;
	width: 100%;
}

.bar {
	display: flex;
	align-items: center;
	gap: 8px;
}

.bar-spacer {
	flex: 1;
}

.loading {
	display: flex;
	justify-content: center;
	padding: 64px 0;
}

.gallery {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.gallery-main {
	width: 100%;
	aspect-ratio: 4 / 3;
	border-radius: var(--radius-lg);
	overflow: hidden;
	background: var(--color-surface-hover);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-text-tertiary);

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
}

.gallery-strip {
	display: flex;
	gap: 8px;
	overflow-x: auto;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
}

.thumb {
	flex-shrink: 0;
	width: 64px;
	height: 64px;
	border-radius: var(--radius-md);
	overflow: hidden;
	border: 2px solid transparent;
	padding: 0;
	cursor: pointer;
	background: var(--color-surface-hover);

	&.active {
		border-color: var(--color-primary);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.head {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.title {
	margin: 0;
	font-size: var(--text-h5);
	font-weight: 800;
	color: var(--color-text-primary);
	line-height: 1.2;
}

.subtitle {
	margin: 0;
	color: var(--color-text-secondary);
}

.badges {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 2px;
}

.facts {
	margin: 0;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 12px;
	padding: 14px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	background: var(--color-surface);

	.fact {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	dt {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
	}

	dd {
		margin: 0;
		font-weight: 600;
		color: var(--color-text-primary);
		word-break: break-word;
	}
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.notes {
	display: flex;
	flex-direction: column;
	gap: 4px;

	.notes-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
	}

	p {
		margin: 0;
		white-space: pre-wrap;
		color: var(--color-text-primary);
		line-height: 1.5;
	}
}
</style>
