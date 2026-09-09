<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { catalogStore } from '@/modules/catalog/store/catalogStore';
import { FpModal, FpButton, FpInput, FpTextarea, FpMobilePicker } from '@/design-system';
import type { RepeatInterval } from '../domain/Reminder';
import { reminderStore } from '../state/reminderStore';
import { FpHaptics } from '@/shared/lib/haptics';
import { useNotify } from '@/composables/useNotify';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void, (e: 'added'): void }>();

const { notify } = useNotify();

const title = ref('');
const note = ref('');
const productName = ref('');
const productId = ref<string | undefined>(undefined);
const showProduct = ref(false);

const searchResults = computed(() => catalogStore.searchResults.value.map(p => ({ id: p.id, name: p.name })));

const defaultDt = () => new Date(Date.now() + 10 * 60000);
const triggerDate = ref(defaultDt().toISOString().split('T')[0]);
const triggerTime = ref(defaultDt().toTimeString().substring(0, 5));
const repeatInterval = ref<RepeatInterval>('none');

const repeatOptions = [
    { id: 'none', name: 'Разово' },
    { id: 'daily', name: 'Каждый день' },
    { id: 'weekly', name: 'Раз в неделю' },
    { id: 'monthly', name: 'Раз в месяц' },
];

watch(() => props.visible, v => {
    if (!v) return;
    title.value = '';
    note.value = '';
    productName.value = '';
    productId.value = undefined;
    showProduct.value = false;
    repeatInterval.value = 'none';
    const d = defaultDt();
    triggerDate.value = d.toISOString().split('T')[0];
    triggerTime.value = d.toTimeString().substring(0, 5);
});

let searchTimer: any;
const onSearch = (q: string) => {
    clearTimeout(searchTimer);
    if (q.length < 2) return;
    searchTimer = setTimeout(() => catalogStore.searchProducts(q), 400);
};

const onSelectProduct = (item: any) => {
    productName.value = item.name;
    productId.value = item.id;
    if (!title.value.trim()) title.value = `Купить: ${item.name}`;
};

const close = () => emit('update:visible', false);

const isValid = computed(() => !!title.value.trim() && !!triggerDate.value && !!triggerTime.value);

const save = async () => {
    if (!isValid.value) return;
    const dt = new Date(`${triggerDate.value}T${triggerTime.value}:00`);

    await reminderStore.addReminder({
        title: title.value,
        note: note.value || undefined,
        productId: productId.value,
        productName: productId.value ? productName.value : undefined,
        repeatInterval: repeatInterval.value,
        nextTriggerAt: dt.toISOString(),
    });

    FpHaptics.success();
    notify('Напоминание создано', 'success');
    emit('added');
    close();
};
</script>

<template>
  <FpModal :visible="visible" title="Новое напоминание" size="sm"
    @update:visible="emit('update:visible', $event)">
    <div class="form">
      <FpInput variant="outlined" v-model="title" label="О чём напомнить"
        placeholder="Купить молоко, позвонить маме, будильник…" />

      <FpTextarea v-model="note" label="Заметка (необязательно)" :rows="2"
        placeholder="детали, ссылка, сумма…" />

      <div class="row">
        <label class="field">
          <span class="field-label">Дата</span>
          <input type="date" v-model="triggerDate" class="native-input" />
        </label>
        <label class="field">
          <span class="field-label">Время</span>
          <input type="time" v-model="triggerTime" class="native-input" />
        </label>
      </div>

      <FpMobilePicker v-model="repeatInterval" label="Повторять" :items="repeatOptions"
        title="Повтор" @select="repeatInterval = $event.id as any" />

      <button v-if="!showProduct" type="button" class="link-btn" @click="showProduct = true">
        + Привязать товар из каталога
      </button>
      <FpMobilePicker v-else v-model="productName" label="Товар" placeholder="Найти товар…"
        :items="searchResults" title="Выберите товар" allow-create
        @search="onSearch" @select="onSelectProduct" @create="productName = $event" />
    </div>

    <template #footer>
      <FpButton variant="text" size="full" @click="close">Отмена</FpButton>
      <FpButton variant="primary" size="full" :disabled="!isValid" @click="save">Сохранить</FpButton>
    </template>
  </FpModal>
</template>

<style scoped lang="scss">
.form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.row {
    display: flex;
    gap: 12px;
}

.field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.field-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    padding-left: 2px;
}

.native-input {
    width: 100%;
    height: 44px;
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0 12px;
    font-size: 16px;
    color: var(--color-text-primary);
    font-family: inherit;

    &:focus {
        outline: none;
        border-color: var(--color-primary);
    }
}

.link-btn {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
    color: var(--color-primary);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
}
</style>
