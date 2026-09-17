<script setup lang="ts">
import { computed } from 'vue'
import { ImageOff, Trash2 } from 'lucide-vue-next'
import { FpCard, FpChip, FpIconButton } from '@/design-system'
import { ITEM_STATUS_LABELS } from '../../domain/CollectionItem'
import type { CollectionItem } from '../../domain/CollectionItem'
import type { CollectionCategory } from '../../domain/Category'
import type { CollectionTypeConfig } from '../../domain/types'

const props = defineProps<{
	item: CollectionItem
	type: CollectionTypeConfig
	category: CollectionCategory | null
	layout: 'grid' | 'list'
}>()

const emit = defineEmits<{
	(e: 'open'): void
	(e: 'delete'): void
}>()

const subtitle = computed(() =>
	props.type.formatSubtitle?.({ subtitle: props.item.subtitle, data: props.item.data }) ??
	props.item.subtitle ??
	undefined,
)

const statusLabel = computed(() => {
	const s = props.item.status
	return s && s !== 'have' ? ITEM_STATUS_LABELS[s] ?? s : null
})

const qtyBadge = computed(() => (props.item.quantity > 1 ? `×${props.item.quantity}` : null))
</script>

<template>
	<FpCard padding="none" class="item-card" :class="layout" @click="emit('open')">
		<div class="cover">
			<img v-if="item.cover_url" :src="item.cover_url" alt="" loading="lazy" />
			<ImageOff v-else :size="20" class="cover-empty" />
			<span v-if="qtyBadge" class="qty">{{ qtyBadge }}</span>
		</div>

		<div class="body">
			<h3 class="title">{{ item.title }}</h3>
			<p class="subtitle" :class="{ 'is-empty': !subtitle }">{{ subtitle || ' ' }}</p>

			<div class="meta">
				<FpChip v-if="category" static :active="!!category" :color="category.color">
					{{ category.name }}
				</FpChip>
				<span v-if="statusLabel" class="status" :class="item.status">{{ statusLabel }}</span>
				<span v-if="item.status === 'for_sale' && item.price" class="price">{{ item.price }}</span>
			</div>

			<div v-if="item.tags.length" class="tags">
				<span v-for="t in item.tags.slice(0, 4)" :key="t" class="tag">#{{ t }}</span>
			</div>
		</div>

		<FpIconButton class="del" variant="danger" size="sm" label="Удалить"
			@click.stop="emit('delete')">
			<Trash2 :size="15" />
		</FpIconButton>
	</FpCard>
</template>

<style scoped lang="scss">
.item-card {
	position: relative;
	cursor: pointer;
	overflow: hidden;
	transition: transform 0.15s, box-shadow 0.2s;

	&:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-2);

		.del {
			opacity: 1;
		}
	}
}

.cover {
	background: var(--color-surface-hover);
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	color: var(--color-text-tertiary);

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.qty {
	position: absolute;
	bottom: 6px;
	right: 6px;
	background: color-mix(in srgb, var(--color-text-primary) 65%, transparent);
	color: #fff;
	font-size: 0.7rem;
	font-weight: 700;
	padding: 2px 6px;
	border-radius: var(--radius-pill, 9999px);
}

.body {
	padding: 10px 12px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.title {
	margin: 0;
	// fixed 2-line slot regardless of how many lines the title actually needs, so every
	// card in the grid reserves the same height here (not just capped at a max)
	min-height: 2.5em;
	font-size: 0.92rem;
	font-weight: 700;
	color: var(--color-text-primary);
	line-height: 1.25;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	word-break: break-word;
}

.subtitle {
	margin: 0;
	min-height: 1.3em;
	line-height: 1.3;
	font-size: 0.8rem;
	color: var(--color-text-secondary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	&.is-empty {
		visibility: hidden;
	}
}

.meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
	min-height: 24px;
	margin-top: 2px;
}

.status {
	font-size: 0.7rem;
	font-weight: 700;
	padding: 2px 7px;
	border-radius: var(--radius-pill, 9999px);
	background: var(--color-surface-hover);
	color: var(--color-text-secondary);

	&.for_sale {
		background: color-mix(in srgb, var(--color-success) 18%, transparent);
		color: var(--color-success);
	}

	&.expired,
	&.low {
		background: color-mix(in srgb, var(--color-error) 18%, transparent);
		color: var(--color-error);
	}
}

.price {
	font-size: 0.7rem;
	font-weight: 700;
	color: var(--color-text-primary);
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	font-size: 0.7rem;
	color: var(--color-text-tertiary);
	max-height: 2.4em;
	overflow: hidden;
}

.tag {
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.del {
	position: absolute;
	top: 6px;
	right: 6px;
	background: color-mix(in srgb, var(--color-surface) 85%, transparent);
	opacity: 0;
	transition: opacity 0.15s;

	@media (hover: none) {
		opacity: 1;
	}
}

/* grid */
.item-card.grid .cover {
	aspect-ratio: 3 / 4;
}

/* list */
.item-card.list {
	display: grid;
	grid-template-columns: 64px 1fr;
	align-items: stretch;

	.del {
		opacity: 1;
		background: none;
	}
}
</style>
