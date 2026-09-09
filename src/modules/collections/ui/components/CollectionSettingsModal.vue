<script setup lang="ts">
import { ref, watch } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { FpModal, FpButton, FpInput, FpConfirmationModal } from '@/design-system'
import { useNotify } from '@/composables/useNotify'
import { FpHaptics } from '@/shared/lib/haptics'
import { useCollectionsStore } from '../../state/useCollectionsStore'
import { getCollectionType } from '../../config'
import type { Collection } from '../../domain/Collection'

const props = defineProps<{
	visible: boolean
	collection: Collection
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'renamed', name: string): void
	(e: 'deleted'): void
}>()

const { notify } = useNotify()
const store = useCollectionsStore()

const name = ref('')
const saving = ref(false)
const deleting = ref(false)
const confirmDelete = ref(false)

watch(
	() => props.visible,
	v => {
		if (!v) return
		name.value = props.collection.name
		confirmDelete.value = false
	},
)

const dirty = () => name.value.trim() && name.value.trim() !== props.collection.name

const save = async () => {
	if (!dirty()) return
	saving.value = true
	try {
		await store.editCollection(props.collection.id, { name: name.value.trim() })
		emit('renamed', name.value.trim())
		FpHaptics.success()
		notify('Сохранено', 'success')
		emit('close')
	} catch (e: any) {
		notify(e.message || 'Не удалось переименовать', 'error')
	} finally {
		saving.value = false
	}
}

const doDelete = async () => {
	deleting.value = true
	try {
		await store.removeCollection(props.collection.id)
		FpHaptics.success()
		notify('Каталог удалён', 'success')
		emit('deleted')
	} catch (e: any) {
		notify(e.message || 'Не удалось удалить', 'error')
	} finally {
		deleting.value = false
	}
}
</script>

<template>
	<FpModal :visible="visible" title="Настройки каталога" size="sm"
		@update:visible="!$event && emit('close')" @close="emit('close')">
		<div class="settings">
			<FpInput variant="outlined" v-model="name" label="Название каталога" />

			<div class="danger">
				<div class="danger-text">
					<span class="danger-title">Удалить каталог</span>
					<span class="danger-hint">
						Удалятся все элементы ({{ getCollectionType(collection.type).label.toLowerCase() }},
						{{ collection.item_count ?? 0 }} шт.), категории и доступы. Необратимо.
					</span>
				</div>
				<FpButton variant="danger" :loading="deleting" @click="confirmDelete = true">
					<Trash2 :size="16" style="margin-right: 6px" /> Удалить
				</FpButton>
			</div>
		</div>

		<template #footer>
			<FpButton variant="text" size="full" @click="emit('close')">Закрыть</FpButton>
			<FpButton variant="primary" size="full" :loading="saving" :disabled="!dirty()" @click="save">
				Сохранить
			</FpButton>
		</template>
	</FpModal>

	<FpConfirmationModal v-model:visible="confirmDelete" title="Удалить каталог?"
		:message="`«${collection.name}» и всё его содержимое будет удалено без возможности восстановления.`"
		confirm-text="Удалить" variant="danger" @confirm="doDelete" />
</template>

<style scoped lang="scss">
.settings {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.danger {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 14px;
	border: 1px solid color-mix(in srgb, var(--color-error) 40%, var(--color-border));
	border-radius: var(--radius-md);
	background: color-mix(in srgb, var(--color-error) 5%, transparent);
}

.danger-text {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.danger-title {
	font-weight: 700;
	color: var(--color-text-primary);
}

.danger-hint {
	font-size: 0.8rem;
	color: var(--color-text-secondary);
	line-height: 1.4;
}
</style>
