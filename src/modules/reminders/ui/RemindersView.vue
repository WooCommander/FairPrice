<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reminderStore } from '../state/reminderStore';
import AddReminderModal from './AddReminderModal.vue';
import { FpCard, FpButton } from '@/design-system';
import { Bell, Plus, Trash2, ArrowLeft } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();
const showAddModal = ref(false);

const reminders = reminderStore.reminders;

onMounted(async () => {
    await reminderStore.load();
    await reminderStore.requestPermissions();
});

const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const getRepeatLabel = (rep: string) => {
    switch (rep) {
        case 'daily': return 'Каждый день';
        case 'weekly': return 'Раз в неделю';
        case 'monthly': return 'Раз в месяц';
        default: return 'Разово';
    }
};

const toggle = (id: string) => reminderStore.toggleReminder(id);
const remove = (id: string) => reminderStore.removeReminder(id);
</script>

<template>
  <div class="reminders-view">
      <header class="ergo-header">
          <div class="header-inner">
              <button class="nav-btn" @click="router.back()">
                  <ArrowLeft :size="24" />
              </button>
              <h1 class="header-title">Напоминания</h1>
              <div class="header-actions">
                  <button class="icon-btn" @click="showAddModal = true">
                      <Plus :size="24" />
                  </button>
              </div>
          </div>
      </header>
      
      <div class="content">
          <div v-if="reminders.length === 0" class="empty-state">
              <Bell :size="48" class="empty-icon" />
              <p>У вас пока нет напоминаний</p>
              <FpButton @click="showAddModal = true">Создать</FpButton>
          </div>
          <div v-else class="reminders-list">
              <FpCard v-for="r in reminders" :key="r.id" class="reminder-card" :class="{ 'inactive': !r.isActive }">
                  <div class="card-left">
                      <div class="prod-name">{{ r.productName }}</div>
                      <div class="trigger-time">{{ formatTime(r.nextTriggerAt) }} • {{ getRepeatLabel(r.repeatInterval) }}</div>
                  </div>
                  <div class="card-right">
                      <label class="toggle-switch">
                          <input type="checkbox" :checked="r.isActive" @change="toggle(r.id)" />
                          <span class="slider"></span>
                      </label>
                      <button class="delete-btn" @click="remove(r.id)">
                          <Trash2 :size="20" />
                      </button>
                  </div>
              </FpCard>
          </div>
      </div>
      
      <AddReminderModal v-model:visible="showAddModal" />
  </div>
</template>

<style scoped lang="scss">
.reminders-view {
    padding: 0 var(--spacing-sm);
}
.ergo-header {
    padding: 12px 12px 0 12px;
}
.header-inner {
    display: flex;
    align-items: center;
    gap: 12px;
}
.nav-btn, .icon-btn {
    background: none;
    border: none;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
}
.header-title {
    font-size: var(--text-h5);
    font-weight: 700;
    margin: 0;
    flex: 1;
}

.content {
    margin-top: 20px;
}
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--color-text-secondary);
    
    .empty-icon {
        color: var(--color-border);
        margin-bottom: 16px;
    }
    p {
        margin-bottom: 24px;
        font-size: 16px;
    }
}

.reminders-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.reminder-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: opacity 0.3s;
    
    &.inactive {
        opacity: 0.5;
    }
}
.card-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}
.prod-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text-primary);
}
.trigger-time {
    font-size: 12px;
    color: var(--color-primary);
    font-weight: 600;
}
.card-right {
    display: flex;
    align-items: center;
    gap: 16px;
}
.delete-btn {
    background: none;
    border: none;
    color: var(--color-error);
    cursor: pointer;
    padding: 4px;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 24px;

  input { 
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--color-border);
    transition: .3s;
    border-radius: 24px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
    }
  }

  input:checked + .slider {
    background-color: var(--color-primary);
  }

  input:checked + .slider:before {
    transform: translateX(16px);
  }
}
</style>
