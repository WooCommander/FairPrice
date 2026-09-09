import type { RepeatInterval } from '../domain/Reminder';

export const REPEAT_LABELS: Record<RepeatInterval, string> = {
    none: 'Разово',
    daily: 'Каждый день',
    weekly: 'Раз в неделю',
    monthly: 'Раз в месяц',
};

export function repeatLabel(interval: RepeatInterval): string {
    return REPEAT_LABELS[interval] ?? REPEAT_LABELS.none;
}

/**
 * Next trigger time strictly in the future for a repeating reminder.
 * Returns null for one-off ('none') reminders.
 */
export function advanceTrigger(iso: string, interval: RepeatInterval): string | null {
    if (interval === 'none') return null;

    const d = new Date(iso);
    const now = Date.now();
    // guard against pathological inputs
    let guard = 0;
    do {
        if (interval === 'daily') d.setDate(d.getDate() + 1);
        else if (interval === 'weekly') d.setDate(d.getDate() + 7);
        else if (interval === 'monthly') d.setMonth(d.getMonth() + 1);
        guard++;
    } while (d.getTime() <= now && guard < 1200);

    return d.toISOString();
}

export function formatTriggerTime(iso: string): string {
    return new Date(iso).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}
