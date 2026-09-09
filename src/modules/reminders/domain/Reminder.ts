export type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
    id: string;
    /** what to remind about — free text: "Купить молоко", "Позвонить маме", "Будильник" */
    title: string;
    /** optional extra text shown in the notification body */
    note?: string;
    /** optional link to a catalog product (purchase reminders) */
    productId?: string;
    productName?: string;
    repeatInterval: RepeatInterval;
    nextTriggerAt: string; // ISO String
    isActive: boolean;
    notificationId?: number; // OS level notification ID
    /** ISO — set the moment it fires; used for the "сработало" state in the UI */
    lastFiredAt?: string;
}

export interface ReminderInsertDTO {
    title: string;
    note?: string;
    productId?: string;
    productName?: string;
    repeatInterval: RepeatInterval;
    nextTriggerAt: string;
}
