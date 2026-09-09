<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Trash2, MailCheck, Clock } from 'lucide-vue-next'
import { FpModal, FpButton, FpInput, FpSelect, FpIconButton, FpEmptyState } from '@/design-system'
import { useNotify } from '@/composables/useNotify'
import { FpHaptics } from '@/shared/lib/haptics'
import { useCollectionSharesStore } from '../../state/useCollectionSharesStore'
import { SHARE_ROLE_LABELS, SHARE_ROLE_HINTS } from '../../domain/Share'
import type { ShareRole } from '../../domain/Share'

const props = defineProps<{
	visible: boolean
	collectionId: string
	collectionName: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { notify } = useNotify()
const { shares, isLoading, load, invite, setRole, revoke } = useCollectionSharesStore()

const email = ref('')
const role = ref<ShareRole>('viewer')
const inviting = ref(false)

const roleOptions = computed(() =>
	(['viewer', 'editor'] as ShareRole[]).map(r => ({
		value: r,
		label: `${SHARE_ROLE_LABELS[r]} — ${SHARE_ROLE_HINTS[r]}`,
	})),
)
const roleShort = computed(() =>
	(['viewer', 'editor'] as ShareRole[]).map(r => ({ value: r, label: SHARE_ROLE_LABELS[r] })),
)

watch(
	() => props.visible,
	v => {
		if (!v) return
		email.value = ''
		role.value = 'viewer'
		load(props.collectionId, true)
	},
)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submitInvite = async () => {
	const value = email.value.trim()
	if (!EMAIL_RE.test(value)) {
		notify('Введите корректный email', 'warning')
		return
	}
	inviting.value = true
	try {
		await invite({ collection_id: props.collectionId, member_email: value, role: role.value })
		email.value = ''
		FpHaptics.success()
		notify('Приглашение добавлено', 'success')
	} catch (e: any) {
		notify(e.message || 'Не удалось пригласить', 'error')
	} finally {
		inviting.value = false
	}
}

const changeRole = async (id: string, next: string | number | null) => {
	try {
		await setRole(id, next as ShareRole)
	} catch (e: any) {
		notify(e.message || 'Не удалось изменить роль', 'error')
	}
}

const remove = async (id: string, memberEmail: string) => {
	if (!window.confirm(`Убрать доступ для ${memberEmail}?`)) return
	try {
		await revoke(id)
		FpHaptics.success()
	} catch (e: any) {
		notify(e.message || 'Не удалось убрать доступ', 'error')
	}
}
</script>

<template>
	<FpModal :visible="visible" title="Доступ к каталогу" size="sm"
		@update:visible="!$event && emit('close')" @close="emit('close')">
		<div class="share">
			<p class="hint">
				Приглашённые по email увидят «{{ collectionName }}» в разделе
				«Поделились со мной» после входа в свой аккаунт.
			</p>

			<div class="invite">
				<FpInput variant="outlined" v-model="email" label="Email" type="email"
					placeholder="name@example.com" @keydown.enter="submitInvite" />
				<FpSelect v-model="role" label="Роль" :options="roleOptions" />
				<FpButton variant="primary" size="full" :loading="inviting" @click="submitInvite">
					Пригласить
				</FpButton>
			</div>

			<div class="list">
				<span class="list-label">Участники</span>

				<div v-if="isLoading && !shares.length" class="muted">Загрузка…</div>

				<FpEmptyState v-else-if="!shares.length" compact title="Пока никого"
					description="Каталог виден только вам." />

				<div v-for="s in shares" :key="s.id" class="member">
					<div class="member-main">
						<span class="member-email">{{ s.member_email }}</span>
						<span class="member-status" :class="{ pending: !s.member_id }">
							<component :is="s.member_id ? MailCheck : Clock" :size="12" />
							{{ s.member_id ? 'активен' : 'ожидает входа' }}
						</span>
					</div>
					<div class="member-actions">
						<FpSelect :model-value="s.role" :options="roleShort"
							@update:model-value="v => changeRole(s.id, v)" />
						<FpIconButton variant="danger" size="sm" label="Убрать доступ"
							@click="remove(s.id, s.member_email)">
							<Trash2 :size="15" />
						</FpIconButton>
					</div>
				</div>
			</div>
		</div>

		<template #footer>
			<FpButton variant="text" size="full" @click="emit('close')">Готово</FpButton>
		</template>
	</FpModal>
</template>

<style scoped lang="scss">
.share {
	display: flex;
	flex-direction: column;
	gap: 18px;
}

.hint {
	margin: 0;
	font-size: 0.85rem;
	color: var(--color-text-secondary);
	line-height: 1.4;
}

.invite {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 14px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	background: var(--color-surface);
}

.list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.list-label {
	font-size: 12px;
	font-weight: 600;
	color: var(--color-text-secondary);
	text-transform: uppercase;
	letter-spacing: 0.06em;
}

.muted {
	color: var(--color-text-tertiary);
	font-size: 0.9rem;
}

.member {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
}

.member-main {
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
}

.member-email {
	font-weight: 600;
	color: var(--color-text-primary);
	font-size: 0.9rem;
	overflow: hidden;
	text-overflow: ellipsis;
}

.member-status {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 0.75rem;
	color: var(--color-success);

	&.pending {
		color: var(--color-text-tertiary);
	}
}

.member-actions {
	display: flex;
	gap: 8px;
	align-items: center;

	:deep(.fp-select) {
		flex: 1;
	}
}
</style>
