<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ArrowLeft, Check } from 'lucide-vue-next'
import { FpHaptics } from '@/shared/lib/haptics'
import { useNotify } from '@/composables/useNotify'
import { FpIconButton, FpSpinner, FpConfirmationModal } from '@/design-system'
import { useCollectionsStore } from '../state/useCollectionsStore'
import { useCollectionItemsStore } from '../state/useCollectionItemsStore'
import { useCategoriesStore } from '../state/useCategoriesStore'
import { CollectionService } from '../services/CollectionService'
import { CollectionItemService } from '../services/CollectionItemService'
import { getCollectionType } from '../config'
import ItemFormFields from './components/ItemFormFields.vue'
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

const type = computed(() => getCollectionType(collection.value?.type))

const formRef = ref<InstanceType<typeof ItemFormFields> | null>(null)
const isDirty = computed(() => formRef.value?.isDirty ?? false)

const showLeaveConfirm = ref(false)
let resolveLeave: ((ok: boolean) => void) | null = null

onBeforeRouteLeave(() => {
	if (!isDirty.value) return true
	return new Promise<boolean>(resolve => {
		resolveLeave = resolve
		showLeaveConfirm.value = true
	})
})

const confirmLeave = () => {
	resolveLeave?.(true)
	resolveLeave = null
}
const cancelLeave = () => {
	resolveLeave?.(false)
	resolveLeave = null
}

const load = async () => {
	loading.value = true
	collection.value =
		collectionsStore.getById(collectionId.value) ??
		(await CollectionService.getCollection(collectionId.value))
	if (!collection.value) {
		notify('Коллекция не найдена', 'error')
		router.replace('/collections')
		return
	}
	if (!(collection.value.is_owner || collection.value.my_role === 'editor')) {
		router.replace(`/collections/${collectionId.value}/item/${itemId.value}`)
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

const goBack = () => router.replace(`/collections/${collectionId.value}/item/${itemId.value}`)

const handleSave = async ({ id, dto }: { id?: string; dto: CollectionItemInsertDTO }) => {
	if (!id) return
	try {
		const { collection_id, ...updates } = dto
		void collection_id
		await itemsStore.editItem(id, updates)
		formRef.value?.markSaved()
		FpHaptics.success()
		notify('Сохранено', 'success')
		goBack()
	} catch (e: any) {
		notify(e.message || 'Ошибка сохранения', 'error')
	}
}
</script>

<template>
	<div class="item-edit-view">
		<header class="bar">
			<FpIconButton variant="surface" round label="Назад" @click="goBack">
				<ArrowLeft :size="22" />
			</FpIconButton>
			<h1 class="title">
				Редактировать
				<span v-if="isDirty" class="dirty-hint">не сохранено</span>
			</h1>
			<span class="save-btn-wrap">
				<FpIconButton variant="primary" round label="Сохранить"
					:disabled="loading || formRef?.saving || formRef?.uploading" @click="formRef?.submit()">
					<Check :size="20" />
				</FpIconButton>
				<span v-if="isDirty" class="dirty-dot" />
			</span>
		</header>

		<div v-if="loading" class="loading"><FpSpinner size="md" /></div>

		<ItemFormFields v-else-if="item" ref="formRef" :collection-id="collectionId" :type="type"
			:categories="categoriesStore.categories.value" :initial-data="item" @save="handleSave" />

		<FpConfirmationModal v-model:visible="showLeaveConfirm" title="Покинуть без сохранения?"
			message="Есть несохранённые изменения — они будут потеряны, если уйти сейчас."
			confirm-text="Покинуть" variant="danger" @confirm="confirmLeave" @cancel="cancelLeave" />
	</div>
</template>

<style scoped lang="scss">
.item-edit-view {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding: var(--spacing-md);
	padding-bottom: 100px;
	width: 100%;

	// same reasoning as CollectionItemView: full desktop width leaves the form fields
	// awkwardly stretched, so cap it to a comfortable reading/editing width instead
	@media (min-width: 768px) {
		max-width: 760px;
		margin: 0 auto;
	}
}

.bar {
	display: flex;
	align-items: center;
	gap: 8px;

	.title {
		flex: 1;
		margin: 0;
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--color-text-primary);
	}
}

.dirty-hint {
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--color-warning);
}

.save-btn-wrap {
	position: relative;
	display: inline-flex;
}

.dirty-dot {
	position: absolute;
	top: -2px;
	right: -2px;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: var(--color-warning);
	border: 2px solid var(--color-background);
	pointer-events: none;
}

.loading {
	display: flex;
	justify-content: center;
	padding: 64px 0;
}
</style>
