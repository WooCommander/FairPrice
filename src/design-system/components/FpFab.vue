<script setup lang="ts">
interface Props {
	/** bottom-right (default) or bottom-left */
	position?: 'br' | 'bl'
	/** extra bottom offset in px, on top of the safe-area inset (default clears the bottom nav) */
	offset?: number
	disabled?: boolean
	label?: string
}

const props = withDefaults(defineProps<Props>(), {
	position: 'br',
	offset: 80,
	disabled: false,
})

const emit = defineEmits<{ (e: 'click', event: MouseEvent): void }>()
</script>

<template>
	<button class="fp-fab" :class="[`pos-${position}`, { 'is-extended': !!$slots.label }]"
		:style="{ bottom: `calc(${props.offset}px + env(safe-area-inset-bottom, 0px))` }"
		:disabled="disabled" :aria-label="label" @click="emit('click', $event)">
		<span class="fp-fab__icon"><slot /></span>
		<span v-if="$slots.label" class="fp-fab__label"><slot name="label" /></span>
	</button>
</template>

<style scoped lang="scss">
.fp-fab {
	position: fixed;
	z-index: 50;
	height: 60px;
	min-width: 60px;
	padding: 0;
	border: none;
	border-radius: var(--radius-pill, 9999px);
	background: var(--color-primary);
	color: var(--color-on-primary);
	box-shadow: 0 8px 16px color-mix(in srgb, var(--color-primary) 40%, transparent);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	cursor: pointer;
	transition: transform 0.15s ease, filter 0.15s ease;

	&.pos-br {
		right: var(--spacing-md);
	}

	&.pos-bl {
		left: var(--spacing-md);
	}

	&.is-extended {
		padding: 0 22px;
	}

	&__icon {
		display: inline-flex;
	}

	&__label {
		font-weight: 700;
		font-size: 0.95rem;
	}

	&:hover:not(:disabled) {
		filter: brightness(1.06);
	}

	&:active:not(:disabled) {
		transform: scale(0.94);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}
</style>
