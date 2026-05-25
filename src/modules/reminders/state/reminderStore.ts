import { ref } from 'vue';
import type { Reminder, ReminderInsertDTO } from '../domain/Reminder';
import { ReminderService } from '../services/ReminderService';

const reminders = ref<Reminder[]>([]);

export const reminderStore = {
    reminders,

    async load() {
        reminders.value = ReminderService.loadAll();
    },

    async requestPermissions() {
        return await ReminderService.requestPermissions();
    },

    async addReminder(dto: ReminderInsertDTO) {
        // Adjust trigger time if it's in the past (e.g. for today, but time has passed)
        let triggerDate = new Date(dto.nextTriggerAt);
        const now = new Date();
        
        if (triggerDate < now) {
            // Push to tomorrow if it's daily, or just push 1 minute ahead for testing
            if (dto.repeatInterval === 'daily') {
                triggerDate.setDate(triggerDate.getDate() + 1);
            } else {
                // If it's none, but time is in past, set to +1 min from now
                triggerDate = new Date(now.getTime() + 60000);
            }
        }

        const reminder: Reminder = {
            id: Date.now().toString(),
            productName: dto.productName,
            productId: dto.productId,
            repeatInterval: dto.repeatInterval,
            nextTriggerAt: triggerDate.toISOString(),
            isActive: true
        };

        await ReminderService.scheduleNotification(reminder);
        reminders.value.push(reminder);
        ReminderService.saveAll(reminders.value);
    },

    async toggleReminder(id: string) {
        const index = reminders.value.findIndex(r => r.id === id);
        if (index > -1) {
            const r = reminders.value[index];
            r.isActive = !r.isActive;

            if (r.isActive) {
                await ReminderService.scheduleNotification(r);
            } else if (r.notificationId) {
                await ReminderService.cancelNotification(r.notificationId);
            }
            ReminderService.saveAll(reminders.value);
        }
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
