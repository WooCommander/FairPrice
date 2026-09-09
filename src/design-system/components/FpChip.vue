<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
	active?: boolean
	/** background when active (defaults to the primary colour) */
	color?: string | null
	removable?: boolean
	disabled?: boolean
	/** render as <span> instead of <button> */
	static?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	active: false,
	removable: false,
	disabled: false,
	static: false,
})

const emit = defineEmits<{
	(e: 'click'): void
	(e: 'remove'): void
}>()

const style = computed(() =>
	props.active && props.color
		? { background: props.color, borderColor: props.color, color: '#1f2937' }
		: undefined,
)
</script>

<template>
	<component :is="static ? 'span' : 'button'" class="fp-chip" :class="{ 'is-active': active }"
		:style="style" :disabled="!static && disabled" :type="static ? undefined : 'button'"
		@click="!static && emit('click')">
		<slot />
		<span v-if="removable" class="fp-chip__x" @click.stop="emit('remove')">
			<X :size="12" />
		</span>
	</component>
</template>

<style scoped lang="scss">
.fp-chip {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	flex-shrink: 0;
	padding: 6px 12px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-pill, 9999px);
	background: var(--color-surface);
	color: var(--color-text-secondary);
	font-size: 0.8rem;
	font-weight: 600;
	font-family: inherit;
	cursor: pointer;
	transition: background 0.15s, color 0.15s, border-color 0.15s;

	&.is-active {
		border-color: var(--color-primary);
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&__x {
		display: inline-flex;
		align-items: center;
		color: currentColor;
		opacity: 0.7;

		&:hover {
			opacity: 1;
		}
	}
}

span.fp-chip {
	cursor: default;
}
</style>
