<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
	modelValue: string[]
	label?: string
	placeholder?: string
	disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: 'добавить…',
	disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string[]): void }>()

const draft = ref('')

const commit = () => {
	const raw = draft.value.trim().replace(/,+$/, '').trim()
	draft.value = ''
	if (!raw) return
	if (props.modelValue.includes(raw)) return
	emit('update:modelValue', [...props.modelValue, raw])
}

const removeAt = (i: number) => {
	const next = [...props.modelValue]
	next.splice(i, 1)
	emit('update:modelValue', next)
}

const onKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Enter' || e.key === ',') {
		e.preventDefault()
		commit()
	} else if (e.key === 'Backspace' && !draft.value && props.modelValue.length) {
		removeAt(props.modelValue.length - 1)
	}
}
</script>

<template>
	<div class="fp-tags" :class="{ 'is-disabled': disabled }">
		<span v-if="label" class="fp-tags__label">{{ label }}</span>
		<div class="fp-tags__box">
			<span v-for="(tag, i) in modelValue" :key="tag" class="fp-tags__chip">
				{{ tag }}
				<button type="button" @click="removeAt(i)"><X :size="12" /></button>
			</span>
			<input v-model="draft" type="text" :placeholder="placeholder" :disabled="disabled"
				@keydown="onKeydown" @blur="commit" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.fp-tags {
	display: flex;
	flex-direction: column;
	gap: 5px;

	&.is-disabled {
		opacity: 0.5;
		pointer-events: none;
	}
}

.fp-tags__label {
	font-size: 12px;
	font-weight: 500;
	color: var(--color-text-secondary);
	padding-left: 2px;
}

.fp-tags__box {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	padding: 8px;
	min-height: 44px;
	border: 1.5px solid var(--color-border);
	border-radius: var(--radius-md);
	background: var(--color-surface);
	transition: border-color 0.2s;

	&:focus-within {
		border-color: var(--color-primary);
	}

	input {
		flex: 1;
		min-width: 90px;
		border: none;
		background: none;
		padding: 4px;
		font-size: 0.9rem;
		font-family: inherit;
		color: var(--color-text-primary);

		&:focus {
			outline: none;
		}
	}
}

.fp-tags__chip {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 6px 3px 10px;
	background: var(--color-surface-hover);
	border-radius: var(--radius-pill, 9999px);
	font-size: 0.8rem;
	color: var(--color-text-primary);

	button {
		display: inline-flex;
		border: none;
		background: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-text-tertiary);

		&:hover {
			color: var(--color-text-primary);
		}
	}
}
</style>
