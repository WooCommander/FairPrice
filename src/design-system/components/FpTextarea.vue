<script setup lang="ts">
interface Props {
	modelValue: string
	label?: string
	placeholder?: string
	rows?: number
	disabled?: boolean
	error?: string
	maxlength?: number
}

withDefaults(defineProps<Props>(), { rows: 3, disabled: false })

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const onInput = (e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
</script>

<template>
	<label class="fp-textarea" :class="{ 'is-disabled': disabled, 'has-error': !!error }">
		<span v-if="label" class="fp-textarea__label">{{ label }}</span>
		<textarea :value="modelValue" :rows="rows" :placeholder="placeholder" :disabled="disabled"
			:maxlength="maxlength" @input="onInput" />
		<span v-if="error" class="fp-textarea__error">{{ error }}</span>
	</label>
</template>

<style scoped lang="scss">
.fp-textarea {
	display: flex;
	flex-direction: column;
	gap: 5px;

	&.is-disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	textarea {
		width: 100%;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-primary);
		font-size: 16px;
		font-family: inherit;
		line-height: 1.5;
		padding: 10px 12px;
		resize: vertical;
		transition: border-color 0.2s;

		&:focus {
			outline: none;
			border-color: var(--color-primary);
		}

		&::placeholder {
			color: var(--color-text-disabled);
		}
	}

	&.has-error textarea {
		border-color: var(--color-error);
	}
}

.fp-textarea__label {
	font-size: 12px;
	font-weight: 500;
	color: var(--color-text-secondary);
	padding-left: 2px;
}

.fp-textarea__error {
	font-size: var(--text-caption);
	color: var(--color-error);
	padding-left: 2px;
}
</style>
