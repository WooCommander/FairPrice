<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Trash2, Pencil, MailCheck, Clock } from 'lucide-vue-next'
import { FpModal, FpButton, FpInput, FpChip, FpIconButton, FpEmptyState } from '@/design-system'
import { useNotify } from '@/composables/useNotify'
import { FpHaptics } from '@/shared/lib/haptics'
import { useBirthdaySharesStore } from '../../state/useBirthdaySharesStore'
import { BIRTHDAY_SCOPE_LABELS } from '../../domain/Share'
import type { BirthdayShareScope } from '../../domain/Share'
import type { Birthday } from '../../domain/Birthday'

const props = defineProps<{
	visible: boolean
	birthdays: readonly Birthday[]
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { notify } = useNotify()
const { shares, isLoading, load, invite, updateShare, revoke } = useBirthdaySharesStore()

const form = reactive({
	editingId: null as string | null,
	email: '',
	scope: 'all' as BirthdayShareScope,
	selected: [] as string[],
})
const busy = ref(false)

const isEdit = computed(() => form.editingId !== null)

const resetForm = () => {
	form.editingId = null
	form.email = ''
	form.scope = 'all'
	form.selected = []
}

watch(
	() => props.visible,
	v => {
		if (!v) return
		resetForm()
		load(true)
	},
)

const bdayLabel = (b: Birthday) => {
	const d = String(b.day).padStart(2, '0')
	const m = String(b.month).padStart(2, '0')
	return `${b.name} · ${d}.${m}`
}

const toggle = (id: string) => {
	const i = form.selected.indexOf(id)
	if (i === -1) form.selected.push(id)
	else form.selected.splice(i, 1)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submit = async () => {
	if (form.scope === 'selected' && !form.selected.length) {
		notify('Отметь хотя бы один день рождения', 'warning')
		return
	}
	busy.value = true
	try {
		if (isEdit.value) {
			await updateShare(form.editingId!, { scope: form.scope, birthday_ids: form.selected })
			notify('Доступ обновлён', 'success')
		} else {
			if (!EMAIL_RE.test(form.email.trim())) {
				notify('Введите корректный email', 'warning')
				return
			}
			await invite({
				member_email: form.email.trim(),
				scope: form.scope,
				birthday_ids: form.selected,
			})
			FpHaptics.success()
			notify('Приглашение добавлено', 'success')
		}
		resetForm()
	} catch (e: any) {
		notify(e.message || 'Не удалось сохранить', 'error')
	} finally {
		busy.value = false
	}
}

const startEdit = (id: string) => {
	const s = shares.value.find(x => x.id === id)
	if (!s) return
	form.editingId = s.id
	form.email = s.member_email
	form.scope = s.scope
	form.selected = [...s.birthday_ids]
}

const remove = async (id: string, email: string) => {
	if (!window.confirm(`Убрать доступ для ${email}?`)) return
	try {
		await revoke(id)
		if (form.editingId === id) resetForm()
		FpHaptics.success()
	} catch (e: any) {
		notify(e.message || 'Не удалось убрать доступ', 'error')
	}
}

const scopeBadge = (s: { scope: BirthdayShareScope; birthday_ids: readonly string[] }) =>
	s.scope === 'all' ? 'все' : `${s.birthday_ids.length} выбрано`
</script>

<template>
	<FpModal :visible="visible" title="Поделиться днями рождения" size="sm"
		@update:visible="!$event && emit('close')" @close="emit('close')">
		<div class="share">
			<div class="invite">
				<span class="block-label">{{ isEdit ? `Изменить доступ: ${form.email}` : 'Пригласить по email' }}</span>

				<FpInput v-if="!isEdit" variant="outlined" v-model="form.email" label="Email" type="email"
					placeholder="name@example.com" />

				<div class="scope">
					<FpChip :active="form.scope === 'all'" @click="form.scope = 'all'">
						{{ BIRTHDAY_SCOPE_LABELS.all }}
					</FpChip>
					<FpChip :active="form.scope === 'selected'" @click="form.scope = 'selected'">
						{{ BIRTHDAY_SCOPE_LABELS.selected }}
					</FpChip>
				</div>

				<div v-if="form.scope === 'selected'" class="picker">
					<span class="picker-count">Отмечено: {{ form.selected.length }}</span>
					<div class="picker-list">
						<FpChip v-for="b in birthdays" :key="b.id" :active="form.selected.includes(b.id)"
							@click="toggle(b.id)">
							{{ bdayLabel(b) }}
						</FpChip>
						<p v-if="!birthdays.length" class="muted">Сначала добавь дни рождения в список.</p>
					</div>
				</div>

				<div class="invite-actions">
					<FpButton v-if="isEdit" variant="text" size="full" @click="resetForm">Отмена</FpButton>
					<FpButton variant="primary" size="full" :loading="busy" @click="submit">
						{{ isEdit ? 'Сохранить' : 'Пригласить' }}
					</FpButton>
				</div>
			</div>

			<div class="list">
				<span class="block-label">Кому открыт доступ</span>

				<div v-if="isLoading && !shares.length" class="muted">Загрузка…</div>

				<FpEmptyState v-else-if="!shares.length" compact title="Пока никто"
					description="Список видите только вы." />

				<div v-for="s in shares" :key="s.id" class="member">
					<div class="member-main">
						<span class="member-email">{{ s.member_email }}</span>
						<span class="member-sub">
							<span class="scope-badge">{{ scopeBadge(s) }}</span>
							<span class="member-status" :class="{ pending: !s.member_id }">
								<component :is="s.member_id ? MailCheck : Clock" :size="12" />
								{{ s.member_id ? 'активен' : 'ожидает входа' }}
							</span>
						</span>
					</div>
					<div class="member-actions">
						<FpIconButton variant="surface" size="sm" label="Изменить" @click="startEdit(s.id)">
							<Pencil :size="15" />
						</FpIconButton>
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

.block-label {
	font-size: 12px;
	font-weight: 600;
	color: var(--color-text-secondary);
	text-transform: uppercase;
	letter-spacing: 0.06em;
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

.scope {
	display: flex;
	gap: 8px;
}

.picker {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.picker-count {
	font-size: 0.8rem;
	color: var(--color-text-tertiary);
}

.picker-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	max-height: 180px;
	overflow-y: auto;
}

.invite-actions {
	display: flex;
	gap: 10px;
}

.list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.muted {
	color: var(--color-text-tertiary);
	font-size: 0.9rem;
	margin: 0;
}

.member {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 12px;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
}

.member-main {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.member-email {
	font-weight: 600;
	color: var(--color-text-primary);
	font-size: 0.9rem;
	overflow: hidden;
	text-overflow: ellipsis;
}

.member-sub {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.scope-badge {
	font-size: 0.72rem;
	font-weight: 700;
	padding: 2px 7px;
	border-radius: var(--radius-pill, 9999px);
	background: color-mix(in srgb, var(--color-primary) 12%, transparent);
	color: var(--color-primary);
}

.member-status {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 0.72rem;
	color: var(--color-success);

	&.pending {
		color: var(--color-text-tertiary);
	}
}

.member-actions {
	display: flex;
	gap: 6px;
	flex-shrink: 0;
}
</style>
