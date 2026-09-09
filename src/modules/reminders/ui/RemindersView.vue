<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reminderStore } from '../state/reminderStore';
import AddReminderModal from './AddReminderModal.vue';
import { FpCard, FpButton, FpIconButton, FpEmptyState, FpSwitch } from '@/design-system';
import { Bell, Plus, Trash2, ArrowLeft, BellRing } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { repeatLabel, formatTriggerTime } from '../lib/reminderUtils';

const router = useRouter();
const showAddModal = ref(false);

const reminders = reminderStore.reminders;

onMounted(async () => {
    await reminderStore.init();
    await reminderStore.requestPermissions();
});

const firedTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const toggle = (id: string) => reminderStore.toggleReminder(id);
const remove = (id: string) => reminderStore.removeReminder(id);
</script>

<template>
  <div class="reminders-view">
    <header class="hub-header">
      <FpIconButton variant="surface" round label="Назад" @click="router.back()">
        <ArrowLeft :size="22" />
      </FpIconButton>
      <h1 class="title">Напоминания</h1>
      <FpIconButton variant="surface" round label="Добавить" @click="showAddModal = true">
        <Plus :size="20" />
      </FpIconButton>
    </header>

    <p class="subtitle">Напомним о чём угодно — от покупки до простого будильника. Пока приложение
      открыто, напоминание всплывёт сразу.</p>

    <FpEmptyState v-if="reminders.length === 0" title="Пока нет напоминаний"
      description="Создай первое — например, «купить хлеб завтра в 9:00».">
      <template #icon><Bell :size="44" /></template>
      <FpButton size="sm" @click="showAddModal = true">Создать</FpButton>
    </FpEmptyState>

    <div v-else class="reminders-list">
      <FpCard v-for="r in reminders" :key="r.id" class="reminder-card" :class="{ inactive: !r.isActive }">
        <div class="card-left">
          <div class="prod-name">{{ r.title }}</div>
          <div v-if="r.note" class="note">{{ r.note }}</div>
          <div class="trigger-time">
            {{ formatTriggerTime(r.nextTriggerAt) }} · {{ repeatLabel(r.repeatInterval) }}
          </div>
          <div v-if="r.lastFiredAt" class="fired">
            <BellRing :size="12" /> сработало {{ firedTime(r.lastFiredAt) }}
          </div>
        </div>
        <div class="card-right">
          <FpSwitch :model-value="r.isActive" @update:model-value="toggle(r.id)" />
          <FpIconButton variant="danger" size="sm" label="Удалить" @click="remove(r.id)">
            <Trash2 :size="16" />
          </FpIconButton>
        </div>
      </FpCard>
    </div>

    <AddReminderModal v-model:visible="showAddModal" />
  </div>
</template>

<style scoped lang="scss">
.reminders-view {
    padding: var(--spacing-md);
    padding-bottom: 40px;
}

.hub-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: 6px;

    .title {
        font-size: var(--text-h5);
        font-weight: 800;
        margin: 0;
        flex: 1;
        color: var(--color-text-primary);
    }
}

.subtitle {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    margin: 0 0 var(--spacing-lg);
    line-height: 1.4;
}

.reminders-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reminder-card {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    transition: opacity 0.3s;

    &.inactive {
        opacity: 0.55;
    }
}

.card-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
}

.prod-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
}

.note {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.4;
}

.trigger-time {
    font-size: 12px;
    color: var(--color-primary);
    font-weight: 600;
}

.fired {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-tertiary);
}

.card-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

    :deep(.fp-switch) {
        width: auto;
    }
}
</style>
