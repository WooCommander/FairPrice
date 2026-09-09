<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

interface Props {
	modelValue: string
	placeholder?: string
	disabled?: boolean
}

withDefaults(defineProps<Props>(), { placeholder: 'Поиск…', disabled: false })

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void
	(e: 'clear'): void
}>()

const onInput = (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
const clear = () => {
	emit('update:modelValue', '')
	emit('clear')
}
</script>

<template>
	<div class="fp-search" :class="{ 'is-disabled': disabled }">
		<Search :size="16" class="fp-search__icon" />
		<input type="search" :value="modelValue" :placeholder="placeholder" :disabled="disabled"
			@input="onInput" />
		<button v-if="modelValue" type="button" class="fp-search__clear" aria-label="Очистить" @click="clear">
			<X :size="14" />
		</button>
	</div>
</template>

<style scoped lang="scss">
.fp-search {
	display: flex;
	align-items: center;
	gap: 8px;
	height: 44px;
	padding: 0 10px;
	border: 1.5px solid var(--color-border);
	border-radius: var(--radius-md);
	background: var(--color-surface);
	color: var(--color-text-tertiary);
	transition: border-color 0.2s;

	&:focus-within {
		border-color: var(--color-primary);
	}

	&.is-disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		font-size: 0.95rem;
		font-family: inherit;
		color: var(--color-text-primary);

		&:focus {
			outline: none;
		}

		&::-webkit-search-cancel-button {
			display: none;
		}
	}

	&__icon {
		flex-shrink: 0;
	}

	&__clear {
		display: inline-flex;
		border: none;
		background: none;
		color: var(--color-text-tertiary);
		cursor: pointer;
		padding: 2px;

		&:hover {
			color: var(--color-text-primary);
		}
	}
}
</style>
