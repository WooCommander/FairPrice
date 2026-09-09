<script setup lang="ts">
interface Props {
	modelValue: boolean
	label?: string
	description?: string
	disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { disabled: false })

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const toggle = () => {
	if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
	<button type="button" class="fp-switch" :class="{ 'is-on': modelValue, 'is-disabled': disabled }"
		role="switch" :aria-checked="modelValue" @click="toggle">
		<span v-if="label || description" class="fp-switch__text">
			<span v-if="label" class="fp-switch__label">{{ label }}</span>
			<span v-if="description" class="fp-switch__desc">{{ description }}</span>
		</span>
		<span class="fp-switch__track"><span class="fp-switch__thumb" /></span>
	</button>
</template>

<style scoped lang="scss">
.fp-switch {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	width: 100%;
	padding: 0;
	border: none;
	background: none;
	cursor: pointer;
	font: inherit;
	text-align: left;
	color: var(--color-text-primary);

	&.is-disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.fp-switch__text {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.fp-switch__label {
	font-size: 0.95rem;
	font-weight: 600;
}

.fp-switch__desc {
	font-size: 0.8rem;
	color: var(--color-text-tertiary);
}

.fp-switch__track {
	flex-shrink: 0;
	width: 44px;
	height: 26px;
	border-radius: var(--radius-pill, 9999px);
	background: var(--color-border);
	padding: 3px;
	transition: background 0.2s;
}

.fp-switch__thumb {
	display: block;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: var(--color-surface);
	box-shadow: var(--shadow-1, 0 1px 3px rgba(0, 0, 0, 0.2));
	transition: transform 0.2s;
}

.fp-switch.is-on {
	.fp-switch__track {
		background: var(--color-primary);
	}

	.fp-switch__thumb {
		transform: translateX(18px);
	}
}
</style>
