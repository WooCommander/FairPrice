export type RepeatInterval = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
    id: string;
    productName: string;
    productId?: string;
    repeatInterval: RepeatInterval;
    nextTriggerAt: string; // ISO String
    isActive: boolean;
    notificationId?: number; // OS level notification ID
}

export interface ReminderInsertDTO {
    productName: string;
    productId?: string;
    repeatInterval: RepeatInterval;
    nextTriggerAt: string;
}
