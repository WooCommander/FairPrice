<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

export interface SelectOption {
	value: string | number
	label: string
}

interface Props {
	modelValue: string | number | null
	options: Array<SelectOption | string>
	label?: string
	placeholder?: string
	disabled?: boolean
	error?: string
}

const props = withDefaults(defineProps<Props>(), { disabled: false })

const emit = defineEmits<{
	(e: 'update:modelValue', value: string | number | null): void
}>()

const normalized = computed<SelectOption[]>(() =>
	props.options.map(o => (typeof o === 'string' ? { value: o, label: o } : o)),
)

const onChange = (e: Event) => {
	const raw = (e.target as HTMLSelectElement).value
	if (raw === '') {
		emit('update:modelValue', null)
		return
	}
	const match = normalized.value.find(o => String(o.value) === raw)
	emit('update:modelValue', match ? match.value : raw)
}
</script>

<template>
	<label class="fp-select" :class="{ 'is-disabled': disabled, 'has-error': !!error }">
		<span v-if="label" class="fp-select__label">{{ label }}</span>
		<div class="fp-select__box">
			<select :value="modelValue ?? ''" :disabled="disabled" @change="onChange">
				<option v-if="placeholder" value="">{{ placeholder }}</option>
				<option v-for="o in normalized" :key="String(o.value)" :value="o.value">
					{{ o.label }}
				</option>
			</select>
			<ChevronDown :size="18" class="fp-select__chevron" />
		</div>
		<span v-if="error" class="fp-select__error">{{ error }}</span>
	</label>
</template>

<style scoped lang="scss">
.fp-select {
	display: flex;
	flex-direction: column;
	gap: 5px;

	&.is-disabled {
		opacity: 0.5;
		pointer-events: none;
	}
}

.fp-select__label {
	font-size: 12px;
	font-weight: 500;
	color: var(--color-text-secondary);
	padding-left: 2px;
}

.fp-select__box {
	position: relative;
	display: flex;
	align-items: center;

	select {
		appearance: none;
		width: 100%;
		height: 44px;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-primary);
		font-size: 16px;
		font-weight: 500;
		font-family: inherit;
		padding: 0 38px 0 12px;
		cursor: pointer;
		transition: border-color 0.2s;

		&:focus {
			outline: none;
			border-color: var(--color-primary);
		}
	}
}

.fp-select__chevron {
	position: absolute;
	right: 12px;
	pointer-events: none;
	color: var(--color-text-secondary);
}

.has-error .fp-select__box select {
	border-color: var(--color-error);
}

.fp-select__error {
	font-size: var(--text-caption);
	color: var(--color-error);
	padding-left: 2px;
}
</style>
