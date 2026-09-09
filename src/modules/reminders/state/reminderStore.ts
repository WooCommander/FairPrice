import { ref } from 'vue';
import type { Reminder, ReminderInsertDTO } from '../domain/Reminder';
import { ReminderService } from '../services/ReminderService';
import { advanceTrigger } from '../lib/reminderUtils';
import { useNotify } from '@/composables/useNotify';

const reminders = ref<Reminder[]>([]);

const { notify } = useNotify();

let started = false;
let tickHandle: ReturnType<typeof setInterval> | null = null;

/** Show the reminder in-app and move it forward (or switch it off). */
function fireOne(r: Reminder) {
    notify(r.note ? `🔔 ${r.title} — ${r.note}` : `🔔 ${r.title}`, 'warning', 8000);
    r.lastFiredAt = new Date().toISOString();

    const next = advanceTrigger(r.nextTriggerAt, r.repeatInterval);
    if (next) {
        r.nextTriggerAt = next;
    } else {
        r.isActive = false;
    }
}

/** Fire everything that is due right now. Called by the ticker, on resume, and on OS events. */
function fireDue() {
    const now = Date.now();
    let changed = false;
    for (const r of reminders.value) {
        if (!r.isActive) continue;
        if (new Date(r.nextTriggerAt).getTime() > now) continue;
        fireOne(r);
        changed = true;
    }
    if (changed) ReminderService.saveAll(reminders.value);
}

function handleOsFired(notificationId: number) {
    const r = reminders.value.find(x => x.notificationId === notificationId);
    if (r && r.isActive && !isFuture(r.nextTriggerAt)) {
        fireOne(r);
        ReminderService.saveAll(reminders.value);
    }
    // also sweep anything else that came due
    fireDue();
}

const isFuture = (iso: string) => new Date(iso).getTime() > Date.now() + 1000;

export const reminderStore = {
    reminders,

    async load() {
        const raw = ReminderService.loadAll();
        // migrate legacy purchase-only reminders (had productName, no title)
        reminders.value = raw.map(r => ({
            ...r,
            title: (r as any).title || (r as any).productName || 'Напоминание',
        }));
    },

    /** Idempotent. Starts realtime handling: OS listeners + foreground ticker + resume sweep. */
    async init() {
        if (started) {
            await this.load();
            return;
        }
        started = true; // set synchronously so concurrent callers don't double-init

        await this.load();
        fireDue(); // catch anything already overdue when the app opens

        await ReminderService.initListeners(handleOsFired);
        tickHandle = setInterval(fireDue, 30_000);

        try {
            const { App } = await import('@capacitor/app');
            App.addListener('resume', () => fireDue());
        } catch {
            /* not native — resume events are irrelevant */
        }
    },

    stop() {
        if (tickHandle) clearInterval(tickHandle);
        tickHandle = null;
        started = false;
    },

    async requestPermissions() {
        return await ReminderService.requestPermissions();
    },

    async addReminder(dto: ReminderInsertDTO) {
        // Adjust trigger time if it's in the past
        let triggerDate = new Date(dto.nextTriggerAt);
        const now = new Date();

        if (triggerDate < now) {
            if (dto.repeatInterval !== 'none') {
                triggerDate = new Date(advanceTrigger(triggerDate.toISOString(), dto.repeatInterval)!);
            } else {
                triggerDate = new Date(now.getTime() + 60000);
            }
        }

        const reminder: Reminder = {
            id: Date.now().toString(),
            title: dto.title.trim(),
            note: dto.note?.trim() || undefined,
            productId: dto.productId,
            productName: dto.productName,
            repeatInterval: dto.repeatInterval,
            nextTriggerAt: triggerDate.toISOString(),
            isActive: true,
        };

        await ReminderService.scheduleNotification(reminder);
        reminders.value.push(reminder);
        ReminderService.saveAll(reminders.value);
    },

    async toggleReminder(id: string) {
        const r = reminders.value.find(x => x.id === id);
        if (!r) return;
        r.isActive = !r.isActive;

        if (r.isActive) {
            // if its time has passed, roll forward before rescheduling
            if (!isFuture(r.nextTriggerAt)) {
                const next = advanceTrigger(r.nextTriggerAt, r.repeatInterval);
                r.nextTriggerAt = next ?? new Date(Date.now() + 60000).toISOString();
            }
            r.lastFiredAt = undefined;
            await ReminderService.scheduleNotification(r);
        } else if (r.notificationId) {
            await ReminderService.cancelNotification(r.notificationId);
        }
        ReminderService.saveAll(reminders.value);
    },

    async removeReminder(id: string) {
        const index = reminders.value.findIndex(r => r.id === id);
        if (index > -1) {
            const r = reminders.value[index];
            if (r.notificationId) {
                await ReminderService.cancelNotification(r.notificationId);
            }
            reminders.value.splice(index, 1);
            ReminderService.saveAll(reminders.value);
        }
    }
};
