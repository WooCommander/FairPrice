<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { FpModal, FpButton, FpInput, FpChip } from '@/design-system'
import { COLLECTION_TYPES } from '../../config'
import { resolveIcon } from '../../config/icons'
import { FpHaptics } from '@/shared/lib/haptics'
import type { CollectionInsertDTO } from '../../domain/Collection'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
	(e: 'close'): void
	(e: 'create', dto: CollectionInsertDTO): void
}>()

const typeKey = ref(COLLECTION_TYPES[0]?.key ?? '')
const name = ref('')
const saving = ref(false)

const selectedType = computed(() => COLLECTION_TYPES.find(t => t.key === typeKey.value))

watch(
	() => props.visible,
	v => {
		if (!v) return
		typeKey.value = COLLECTION_TYPES[0]?.key ?? ''
		name.value = COLLECTION_TYPES[0]?.defaultCollectionName ?? ''
		saving.value = false
	},
)

const pickType = (key: string) => {
	typeKey.value = key
	const t = COLLECTION_TYPES.find(x => x.key === key)
	if (t) name.value = t.defaultCollectionName
	FpHaptics.light()
}

const submit = () => {
	if (!name.value.trim() || !typeKey.value) return
	saving.value = true
	emit('create', { type: typeKey.value, name: name.value.trim(), icon: selectedType.value?.icon })
}
</script>

<template>
	<FpModal :visible="visible" title="Новый каталог" size="sm"
		@update:visible="!$event && emit('close')" @close="emit('close')">
		<div class="form">
			<div class="block">
				<span class="block-label">Что храним</span>
				<div class="types">
					<FpChip v-for="t in COLLECTION_TYPES" :key="t.key" :active="t.key === typeKey"
						@click="pickType(t.key)">
						<component :is="resolveIcon(t.icon)" :size="16" />
						{{ t.label }}
					</FpChip>
				</div>
			</div>

			<FpInput variant="outlined" v-model="name" label="Название каталога"
				placeholder="Например, Моя библиотека" />
		</div>

		<template #footer>
			<FpButton variant="text" size="full" @click="emit('close')">Отмена</FpButton>
			<FpButton variant="primary" size="full" :loading="saving" :disabled="!name.trim()"
				@click="submit">
				Создать
			</FpButton>
		</template>
	</FpModal>
</template>

<style scoped lang="scss">
.form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.block {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.block-label {
	font-size: 12px;
	font-weight: 500;
	color: var(--color-text-secondary);
	padding-left: 2px;
}

.types {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}
</style>
