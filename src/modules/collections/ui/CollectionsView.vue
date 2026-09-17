<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Library, Users } from 'lucide-vue-next'
import { FpHaptics } from '@/shared/lib/haptics'
import { useNotify } from '@/composables/useNotify'
import { FpCard, FpEmptyState, FpIconButton, FpSpinner } from '@/design-system'
import { useCollectionsStore } from '../state/useCollectionsStore'
import { useCollectionsFab } from '../state/useCollectionsFab'
import { getCollectionType } from '../config'
import { resolveIcon } from '../config/icons'
import CreateCollectionModal from './components/CreateCollectionModal.vue'
import type { CollectionInsertDTO } from '../domain/Collection'

const router = useRouter()
const { notify } = useNotify()
const {
	ownCollections,
	sharedCollections,
	isLoading,
	isLoaded,
	fetchCollections,
	addCollection,
} = useCollectionsStore()

const showCreate = ref(false)

const { setFabAction } = useCollectionsFab()

onMounted(() => {
	fetchCollections()
	setFabAction({
		label: 'Создать коллекцию',
		onClick: () => {
			FpHaptics.selection()
			showCreate.value = true
		},
	})
})
onUnmounted(() => setFabAction(null))

const open = (id: string) => {
	FpHaptics.light()
	router.push(`/collections/${id}`)
}

const handleCreate = async (dto: CollectionInsertDTO) => {
	try {
		const created = await addCollection(dto)
		showCreate.value = false
		notify('Коллекция создана', 'success')
		router.push(`/collections/${created.id}`)
	} catch (e: any) {
		console.error(e)
		notify(e.message || 'Не удалось создать коллекцию', 'error')
	}
}

const typeLabel = (type: string) => getCollectionType(type).label
</script>

<template>
	<div class="collections-view">
		<header class="hub-header">
			<FpIconButton variant="surface" round label="Назад" @click="router.back()">
				<ArrowLeft :size="22" />
			</FpIconButton>
			<h1 class="title">Коллекции</h1>
		</header>
		<p class="subtitle">Домашние коллекции: книги, аптечка и что угодно ещё.</p>

		<div v-if="isLoading && !isLoaded" class="loading">
			<FpSpinner size="md" />
		</div>

		<template v-else>
			<section v-if="ownCollections.length" class="grid">
				<FpCard v-for="c in ownCollections" :key="c.id" class="coll-card" @click="open(c.id)">
					<span class="coll-icon">
						<component :is="resolveIcon(c.icon || getCollectionType(c.type).icon)" :size="26" />
					</span>
					<span class="coll-name">{{ c.name }}</span>
					<span class="coll-meta">{{ typeLabel(c.type) }} · {{ c.item_count }}</span>
				</FpCard>
			</section>

			<FpEmptyState v-else title="Пока нет коллекций"
				description="Создай первый — например, домашнюю библиотеку.">
				<template #icon><Library :size="44" /></template>
			</FpEmptyState>

			<section v-if="sharedCollections.length" class="shared">
				<h2 class="section-label"><Users :size="16" /> Поделились со мной</h2>
				<div class="grid">
					<FpCard v-for="c in sharedCollections" :key="c.id" class="coll-card shared-card"
						@click="open(c.id)">
						<span class="coll-icon">
							<component :is="resolveIcon(c.icon || getCollectionType(c.type).icon)" :size="26" />
						</span>
						<span class="coll-name">{{ c.name }}</span>
						<span class="coll-meta">{{ typeLabel(c.type) }} · {{ c.item_count }}</span>
					</FpCard>
				</div>
			</section>
		</template>

		<CreateCollectionModal :visible="showCreate" @close="showCreate = false" @create="handleCreate" />
	</div>
</template>

<style scoped lang="scss">
.collections-view {
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
	margin-bottom: 6px;

	.title {
		margin: 0;
		font-size: var(--text-h5);
		font-weight: 800;
		color: var(--color-text-primary);
	}
}

.subtitle {
	color: var(--color-text-secondary);
	font-size: 0.95rem;
	margin: 0 0 var(--spacing-lg);
}

.loading {
	display: flex;
	justify-content: center;
	padding: 48px 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 12px;
}

.coll-card {
	display: flex;
	flex-direction: column;
	gap: 8px;
	cursor: pointer;
	transition: transform 0.15s, box-shadow 0.2s;

	&:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-2);
	}
}

.coll-icon {
	width: 44px;
	height: 44px;
	border-radius: var(--radius-md);
	background: color-mix(in srgb, var(--color-primary) 12%, transparent);
	color: var(--color-primary);
	display: flex;
	align-items: center;
	justify-content: center;
}

.coll-name {
	font-weight: 700;
	color: var(--color-text-primary);
	line-height: 1.25;
}

.coll-meta {
	font-size: 0.8rem;
	color: var(--color-text-tertiary);
}

.shared {
	margin-top: var(--spacing-xl);
}

.section-label {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-text-tertiary);
	font-weight: 700;
	margin: 0 0 12px;
}

.shared-card .coll-icon {
	background: color-mix(in srgb, var(--color-text-secondary) 14%, transparent);
	color: var(--color-text-secondary);
}
</style>
