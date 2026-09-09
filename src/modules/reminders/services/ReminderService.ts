import { LocalNotifications } from '@capacitor/local-notifications';
import type { Reminder } from '../domain/Reminder';

const STORAGE_KEY = 'fp_reminders';

export class ReminderService {
    static async requestPermissions(): Promise<boolean> {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (e) {
            console.error('LocalNotifications.requestPermissions error', e);
            // It might fail on web, so we just return true for web local testing
            return true;
        }
    }

    static loadAll(): Reminder[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return JSON.parse(data) as Reminder[];
            }
        } catch (e) {
            console.error('Failed to load reminders', e);
        }
        return [];
    }

    static saveAll(reminders: Reminder[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
        } catch (e) {
            console.error('Failed to save reminders', e);
        }
    }

    static async scheduleNotification(reminder: Reminder): Promise<void> {
        if (!reminder.isActive) return;

        const date = new Date(reminder.nextTriggerAt);
        const notificationId = reminder.notificationId || Math.floor(Math.random() * 2000000000);
        reminder.notificationId = notificationId;

        try {
            let schedule: any = { at: date };

            if (reminder.repeatInterval === 'daily') {
                schedule = { every: 'day', at: date };
            } else if (reminder.repeatInterval === 'weekly') {
                schedule = { every: 'week', at: date };
            } else if (reminder.repeatInterval === 'monthly') {
                schedule = { every: 'month', at: date };
            }

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: reminder.title,
                        body: reminder.note || 'Напоминание',
                        id: notificationId,
                        schedule,
                        extra: { reminderId: reminder.id },
                    }
                ]
            });
        } catch (e) {
            console.error('Failed to schedule notification', e);
        }
    }

    static async cancelNotification(notificationId: number): Promise<void> {
        try {
            await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
        } catch (e) {
            console.error('Failed to cancel notification', e);
        }
    }

    /**
     * Wire OS notification events to a callback so the running app reacts
     * in realtime (no restart needed). Safe to call once at startup.
     */
    static async initListeners(onFired: (notificationId: number) => void): Promise<void> {
        try {
            await LocalNotifications.addListener('localNotificationReceived', n => {
                if (typeof n.id === 'number') onFired(n.id);
            });
            await LocalNotifications.addListener('localNotificationActionPerformed', a => {
                const id = a.notification?.id;
                if (typeof id === 'number') onFired(id);
            });
        } catch (e) {
            console.warn('LocalNotifications listeners unavailable (web?)', e);
        }
    }
}
