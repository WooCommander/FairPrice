<script setup lang="ts">
import { computed, ref } from 'vue'
import { FpModal, FpButton } from '@/design-system'
import ItemFormFields from './ItemFormFields.vue'
import type { CollectionItem, CollectionItemInsertDTO } from '../../domain/CollectionItem'
import type { CollectionCategory } from '../../domain/Category'
import type { CollectionTypeConfig } from '../../domain/types'

const props = defineProps<{
	visible: boolean
	collectionId: string
	type: CollectionTypeConfig
	categories: readonly CollectionCategory[]
	initialData: CollectionItem | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'save', payload: { id?: string; dto: CollectionItemInsertDTO }): void
}>()

const isEdit = computed(() => !!props.initialData)

const formRef = ref<InstanceType<typeof ItemFormFields> | null>(null)
</script>

<template>
	<FpModal :visible="visible" :title="isEdit ? 'Редактировать' : `Добавить: ${type.itemLabel}`"
		@update:visible="!$event && emit('close')" @close="emit('close')">
		<ItemFormFields v-if="visible" ref="formRef" :collection-id="collectionId" :type="type"
			:categories="categories" :initial-data="initialData" @save="emit('save', $event)" />

		<template #footer>
			<FpButton variant="text" size="full" @click="emit('close')">Отмена</FpButton>
			<FpButton variant="primary" size="full" :loading="formRef?.saving" :disabled="formRef?.uploading"
				@click="formRef?.submit()">
				{{ isEdit ? 'Сохранить' : 'Добавить' }}
			</FpButton>
		</template>
	</FpModal>
</template>
