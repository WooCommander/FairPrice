<script setup lang="ts">
import { computed } from 'vue'
import { ScanLine } from 'lucide-vue-next'
import { FpInput, FpSelect, FpTextarea, FpNumberInput, FpIconButton } from '@/design-system'
import type { FieldSpec } from '../../domain/types'

const props = defineProps<{
	spec: FieldSpec
	modelValue: unknown
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: unknown): void
	(e: 'scan'): void
}>()

const set = (v: unknown) => emit('update:modelValue', v === '' || v == null ? undefined : v)

const strValue = computed(() => (props.modelValue ?? '') as string | number)
const numValue = computed(() => (props.modelValue ?? '') as number | string)
const selectOptions = computed(() => props.spec.options ?? [])
</script>

<template>
	<div class="dyn-field" :class="{ half: spec.half }">
		<div v-if="spec.type === 'text'" class="scan-row">
			<FpInput variant="outlined" :model-value="strValue" :label="spec.label"
				:placeholder="spec.placeholder" @update:model-value="set" />
			<FpIconButton v-if="spec.scan" variant="surface" :label="`Сканировать ${spec.label}`"
				class="scan-btn" @click="emit('scan')">
				<ScanLine :size="18" />
			</FpIconButton>
		</div>

		<FpNumberInput v-else-if="spec.type === 'number'" :model-value="numValue" :label="spec.label"
			:placeholder="spec.placeholder" @update:model-value="set" />

		<FpInput v-else-if="spec.type === 'date'" variant="outlined" type="date" :model-value="strValue"
			:label="spec.label" @update:model-value="set" />

		<FpSelect v-else-if="spec.type === 'select'" :model-value="(modelValue as string) ?? null"
			:label="spec.label" :options="selectOptions" placeholder="—" @update:model-value="set" />

		<FpTextarea v-else-if="spec.type === 'textarea'" :model-value="(strValue as string)"
			:label="spec.label" :placeholder="spec.placeholder" @update:model-value="set" />

		<label v-else-if="spec.type === 'boolean'" class="bool">
			<input type="checkbox" :checked="Boolean(modelValue)"
				@change="set(($event.target as HTMLInputElement).checked)" />
			<span>{{ spec.placeholder || spec.label }}</span>
		</label>
	</div>
</template>

<style scoped lang="scss">
.dyn-field {
	&.half {
		flex: 1 1 calc(50% - 6px);
		min-width: 140px;
	}
}

.scan-row {
	display: flex;
	gap: 8px;
	align-items: flex-end;
}

.scan-btn {
	margin-bottom: 1px;
}

.bool {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.9rem;
	color: var(--color-text-primary);
}
</style>
