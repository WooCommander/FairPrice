<script setup lang="ts">
interface Props {
	title: string
	description?: string
	compact?: boolean
}

withDefaults(defineProps<Props>(), { compact: false })
</script>

<template>
	<div class="fp-empty" :class="{ compact }">
		<div v-if="$slots.icon" class="fp-empty__icon">
			<slot name="icon" />
		</div>
		<h3 class="fp-empty__title">{{ title }}</h3>
		<p v-if="description" class="fp-empty__desc">{{ description }}</p>
		<div v-if="$slots.default" class="fp-empty__actions">
			<slot />
		</div>
	</div>
</template>

<style scoped lang="scss">
.fp-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	gap: 8px;
	padding: 48px 24px;
	color: var(--color-text-secondary);

	&.compact {
		padding: 28px 16px;
	}
}

.fp-empty__icon {
	width: 84px;
	height: 84px;
	border-radius: 50%;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--color-text-tertiary);
	margin-bottom: 8px;

	.compact & {
		width: 60px;
		height: 60px;
	}
}

.fp-empty__title {
	margin: 0;
	font-size: var(--text-body-1);
	font-weight: 700;
	color: var(--color-text-primary);
}

.fp-empty__desc {
	margin: 0;
	max-width: 280px;
	font-size: 0.9rem;
}

.fp-empty__actions {
	margin-top: 12px;
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	justify-content: center;
}
</style>
