<script setup lang="ts">
import { computed } from 'vue'

interface Props {
	variant?: 'ghost' | 'surface' | 'primary' | 'danger'
	size?: 'sm' | 'md' | 'lg'
	round?: boolean
	disabled?: boolean
	label?: string
	type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'ghost',
	size: 'md',
	round: false,
	disabled: false,
	type: 'button',
})

const emit = defineEmits<{ (e: 'click', event: MouseEvent): void }>()

const classes = computed(() => [
	'fp-icon-btn',
	`fp-icon-btn--${props.variant}`,
	`fp-icon-btn--${props.size}`,
	{ 'is-round': props.round },
])
</script>

<template>
	<button :class="classes" :type="type" :disabled="disabled" :aria-label="label"
		@click="emit('click', $event)">
		<slot />
	</button>
</template>

<style scoped lang="scss">
.fp-icon-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 1px solid transparent;
	border-radius: var(--radius-md);
	background: transparent;
	color: var(--color-text-primary);
	cursor: pointer;
	transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;
	flex-shrink: 0;

	&.is-round {
		border-radius: 50%;
	}

	&--sm {
		width: 32px;
		height: 32px;
	}

	&--md {
		width: 40px;
		height: 40px;
	}

	&--lg {
		width: 48px;
		height: 48px;
	}

	&--ghost:hover:not(:disabled) {
		background: var(--color-surface-hover);
	}

	&--surface {
		background: var(--color-surface);
		border-color: var(--color-border);

		&:hover:not(:disabled) {
			background: var(--color-surface-hover);
		}
	}

	&--primary {
		background: var(--color-primary);
		color: var(--color-on-primary);

		&:hover:not(:disabled) {
			filter: brightness(1.08);
		}
	}

	&--danger {
		color: var(--color-error);

		&:hover:not(:disabled) {
			background: color-mix(in srgb, var(--color-error) 10%, transparent);
		}
	}

	&:active:not(:disabled) {
		transform: scale(0.92);
	}

	&:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
}
</style>
