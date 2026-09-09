<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, Share2 } from 'lucide-vue-next'
import { FpHaptics } from '@/shared/lib/haptics'
import { useNotify } from '@/composables/useNotify'
import { FpChip, FpEmptyState, FpFab, FpIconButton, FpSearchInput, FpSelect, FpSpinner } from '@/design-system'
import { useCollectionsStore } from '../state/useCollectionsStore'
import { useCollectionItemsStore } from '../state/useCollectionItemsStore'
import { useCategoriesStore } from '../state/useCategoriesStore'
import { CollectionService } from '../services/CollectionService'
import { getCollectionType } from '../config'
import ItemModal from './components/ItemModal.vue'
import ItemCard from './components/ItemCard.vue'
import ShareModal from './components/ShareModal.vue'
import type { Collection } from '../domain/Collection'
import type { CollectionItem, CollectionItemInsertDTO } from '../domain/CollectionItem'

const route = useRoute()
const router = useRouter()
const { notify } = useNotify()

const collectionsStore = useCollectionsStore()
const { items, isLoading, load: loadItems, addItem, editItem, removeItem } = useCollectionItemsStore()
const categoriesStore = useCategoriesStore()

const collectionId = computed(() => String(route.params.id))
const collection = ref<Collection | null>(null)

const type = computed(() => getCollectionType(collection.value?.type))
const canEdit = computed(
	() => collection.value?.is_owner || collection.value?.my_role === 'editor',
)

const showShare = ref(false)

const search = ref('')
const activeCategory = ref<string | null>(null)
const sortKey = ref<'recent' | 'title' | string>('recent')

const showModal = ref(false)
const editing = ref<CollectionItem | null>(null)

const loadAll = async () => {
	collection.value =
		collectionsStore.getById(collectionId.value) ??
		(await CollectionService.getCollection(collectionId.value))
	if (!collection.value) {
		notify('Каталог не найден', 'error')
		router.replace('/collections')
		return
	}
	await Promise.all([
		loadItems(collectionId.value, true),
		categoriesStore.load(collectionId.value, true),
	])
}

onMounted(loadAll)
watch(collectionId, loadAll)

const sortOptions = computed(() => [
	{ value: 'recent', label: 'Недавние' },
	{ value: 'title', label: 'По названию' },
	...(type.value.sortOptions ?? []).map(o => ({ value: o.key, label: o.label })),
])

const filtered = computed(() => {
	const q = search.value.trim().toLowerCase()
	let list = items.value.filter(it => {
		if (activeCategory.value && it.category_id !== activeCategory.value) return false
		if (!q) return true
		const hay = [
			it.title,
			it.subtitle,
			it.location,
			...it.tags,
			...Object.values(it.data).map(v => (v == null ? '' : String(v))),
		]
			.join(' ')
			.toLowerCase()
		return hay.includes(q)
	})

	list = [...list]
	if (sortKey.value === 'title') {
		list.sort((a, b) => a.title.localeCompare(b.title))
	} else if (sortKey.value === 'recent') {
		list.sort((a, b) => b.created_at.localeCompare(a.created_at))
	} else {
		const k = sortKey.value
		list.sort((a, b) => {
			const av = a.data[k]
			const bv = b.data[k]
			if (av == null) return 1
			if (bv == null) return -1
			return String(av).localeCompare(String(bv), undefined, { numeric: true })
		})
	}
	return list
})

const openAdd = () => {
	FpHaptics.selection()
	editing.value = null
	showModal.value = true
}
const openItem = (item: CollectionItem) => {
	FpHaptics.light()
	router.push(`/collections/${collectionId.value}/item/${item.id}`)
}
const closeModal = () => {
	showModal.value = false
	setTimeout(() => (editing.value = null), 250)
}

const handleSave = async ({ id, dto }: { id?: string; dto: CollectionItemInsertDTO }) => {
	try {
		if (id) {
			const { collection_id, ...updates } = dto
			void collection_id
			await editItem(id, updates)
		} else {
			await addItem(dto)
		}
		closeModal()
		notify('Сохранено', 'success')
	} catch (e: any) {
		console.error(e)
		notify(e.message || 'Ошибка сохранения', 'error')
	}
}

const handleDelete = async (item: CollectionItem) => {
	FpHaptics.warning()
	if (!window.confirm(`Удалить «${item.title}»?`)) return
	try {
		await removeItem(item.id)
		FpHaptics.success()
	} catch (e: any) {
		notify(e.message || 'Не удалось удалить', 'error')
	}
}
</script>

<template>
	<div class="collection-view">
		<header class="hub-header">
			<FpIconButton variant="surface" round label="Назад" @click="router.push('/collections')">
				<ArrowLeft :size="22" />
			</FpIconButton>
			<h1 class="title">{{ collection?.name || type.label }}</h1>
			<span class="count">{{ items.length }}</span>
			<FpIconButton v-if="collection?.is_owner" variant="surface" round label="Поделиться"
				@click="showShare = true">
				<Share2 :size="18" />
			</FpIconButton>
		</header>

		<div class="toolbar">
			<FpSearchInput v-model="search" :placeholder="`Поиск: ${type.label.toLowerCase()}`" />
			<div class="sort">
				<FpSelect v-model="sortKey" :options="sortOptions" />
			</div>
		</div>

		<div v-if="categoriesStore.categories.value.length" class="cat-chips">
			<FpChip :active="activeCategory === null" @click="activeCategory = null">Все</FpChip>
			<FpChip v-for="c in categoriesStore.categories.value" :key="c.id"
				:active="activeCategory === c.id" :color="c.color"
				@click="activeCategory = activeCategory === c.id ? null : c.id">
				{{ c.name }}
			</FpChip>
		</div>

		<div v-if="isLoading && !items.length" class="loading">
			<FpSpinner size="md" />
		</div>

		<FpEmptyState v-else-if="!filtered.length" compact
			:title="items.length ? 'Ничего не найдено' : 'Пока пусто'"
			:description="items.length ? undefined : 'Добавь первый элемент — кнопка «＋».'" />

		<div v-else class="items" :class="type.listLayout">
			<ItemCard v-for="it in filtered" :key="it.id" :item="it" :type="type"
				:category="categoriesStore.getById(it.category_id)" :layout="type.listLayout"
				@open="openItem(it)" @delete="handleDelete(it)" />
		</div>

		<FpFab v-if="canEdit" :label="`Добавить: ${type.itemLabel}`" @click="openAdd">
			<Plus :size="26" :stroke-width="3" />
		</FpFab>

		<ItemModal :visible="showModal" :collection-id="collectionId" :type="type"
			:categories="categoriesStore.categories.value" :initial-data="editing"
			@close="closeModal" @save="handleSave" />

		<ShareModal v-if="collection" :visible="showShare" :collection-id="collectionId"
			:collection-name="collection.name" @close="showShare = false" />
	</div>
</template>

<style scoped lang="scss">
.collection-view {
	display: flex;
	flex-direction: column;
	padding: var(--spacing-md);
	padding-bottom: 100px;
	min-height: 100%;
}

.hub-header {
	display: flex;
	align-items: center;
	gap: var(--spacing-md);
	margin-bottom: var(--spacing-md);

	.title {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--color-text-primary);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text-tertiary);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill, 9999px);
		padding: 2px 10px;
	}
}

.toolbar {
	display: flex;
	gap: 8px;
	margin-bottom: 12px;

	:deep(.fp-search) {
		flex: 1;
	}
}

.sort {
	flex-shrink: 0;
}

.cat-chips {
	display: flex;
	gap: 8px;
	overflow-x: auto;
	padding-bottom: 8px;
	margin-bottom: 8px;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
}

.loading {
	display: flex;
	justify-content: center;
	padding: 48px 0;
}

.items {
	&.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 12px;
	}

	&.list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
}
</style>
