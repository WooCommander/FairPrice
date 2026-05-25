<script setup lang="ts">
import { ref, computed } from 'vue';
import { catalogStore } from '@/modules/catalog/store/catalogStore';
import { FpButton, FpMobilePicker } from '@/design-system';
import type { RepeatInterval } from '../domain/Reminder';
import { reminderStore } from '../state/reminderStore';
import { FpHaptics } from '@/shared/lib/haptics';

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void, (e: 'added'): void }>();

const isSearching = ref(false);
const searchQuery = ref('');
const searchResults = computed(() => catalogStore.searchResults.value.map(p => ({ id: p.id, name: p.name })));

const productName = ref('');
const productId = ref<string | undefined>(undefined);
// set default date/time to now + 10 mins
const now = new Date(Date.now() + 10 * 60000);
const triggerDate = ref(now.toISOString().split('T')[0]);
const triggerTime = ref(now.toTimeString().substring(0, 5));
const repeatInterval = ref<RepeatInterval>('none');

const repeatOptions = [
    { id: 'none', name: 'Разово' },
    { id: 'daily', name: 'Каждый день' },
    { id: 'weekly', name: 'Раз в неделю' },
    { id: 'monthly', name: 'Раз в месяц' },
];

let searchTimer: any;
const onSearch = (q: string) => {
    searchQuery.value = q;
    productName.value = q;
    clearTimeout(searchTimer);
    if (q.length < 2) return;
    isSearching.value = true;
    searchTimer = setTimeout(async () => {
        await catalogStore.searchProducts(q);
        isSearching.value = false;
    }, 500);
};

const onSelect = (item: any) => {
    productName.value = item.name;
    productId.value = item.id;
};

const close = () => emit('update:visible', false);

const save = async () => {
    if (!productName.value || !triggerDate.value || !triggerTime.value) return;
    // Local date string construction to ISO
    const dt = new Date(`${triggerDate.value}T${triggerTime.value}:00`);
    
    await reminderStore.addReminder({
        productName: productName.value,
        productId: productId.value,
        repeatInterval: repeatInterval.value,
        nextTriggerAt: dt.toISOString()
    });
    
    productName.value = '';
    productId.value = undefined;
    repeatInterval.value = 'none';
    
    FpHaptics.success();
    emit('added');
    close();
};

const isValid = computed(() => productName.value && triggerDate.value && triggerTime.value);
</script>

<template>
  <div v-if="visible" class="modal-overlay">
      <div class="modal-content">
          <div class="modal-header">
              <h3>Новое напоминание</h3>
              <button class="close-btn" @click="close">✕</button>
          </div>
          <div class="modal-body">
              <FpMobilePicker
                  v-model="productName"
                  label="Товар"
                  placeholder="Что напомнить купить?"
                  :items="searchResults"
                  title="Выберите товар"
                  allow-create
                  @search="onSearch"
                  @select="onSelect"
                  @create="productName = $event"
              />
              
              <div class="row mt-3">
                  <div class="field">
                      <label>Дата</label>
                      <input type="date" v-model="triggerDate" class="native-input" />
                  </div>
                  <div class="field">
                      <label>Время</label>
                      <input type="time" v-model="triggerTime" class="native-input" />
                  </div>
              </div>

              <div class="mt-3">
                  <FpMobilePicker
                      v-model="repeatInterval"
                      label="Повторять"
                      :items="repeatOptions"
                      title="Повтор"
                      @select="repeatInterval = $event.id as any"
                  />
              </div>
          </div>
          <div class="modal-footer">
              <FpButton variant="outline" @click="close" style="flex: 1">Отмена</FpButton>
              <FpButton :disabled="!isValid" @click="save" style="flex: 1">Сохранить</FpButton>
          </div>
      </div>
  </div>
</template>

<style scoped lang="scss">
.modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: flex-end;
    z-index: 1000;
}
.modal-content {
    background: var(--color-surface);
    width: 100%;
    border-top-left-radius: var(--radius-lg);
    border-top-right-radius: var(--radius-lg);
    padding: var(--spacing-md);
    padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 20px));
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    h3 { margin: 0; font-size: var(--text-h6); color: var(--color-text-primary); }
    .close-btn { background: none; border: none; font-size: 24px; color: var(--color-text-secondary); cursor: pointer; }
}
.row { display: flex; gap: var(--spacing-sm); }
.field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; }
.native-input {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 12px;
    font-size: 16px;
    color: var(--color-text-primary);
    font-family: inherit;
}
.mt-3 { margin-top: 16px; }
.modal-footer {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: 24px;
}
</style>
