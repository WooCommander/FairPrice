import type { CollectionTypeConfig } from '../domain/types'

export interface MedData {
    expiry?: string        // ISO date, "годен до"
    dosage?: string        // "500 мг"
    form?: string          // таблетки / сироп / ...
    active?: string        // действующее вещество
}

export const medsType: CollectionTypeConfig<MedData> = {
    key: 'meds',
    label: 'Лекарства',
    itemLabel: 'Лекарство',
    icon: 'Pill',
    defaultCollectionName: 'Домашняя аптечка',
    titleHint: 'Название препарата',
    subtitleHint: 'Действующее вещество',
    listLayout: 'list',
    fields: [
        { key: 'expiry', type: 'date', label: 'Годен до', half: true },
        { key: 'dosage', type: 'text', label: 'Дозировка', half: true },
        { key: 'form', type: 'select', label: 'Форма', half: true,
          options: ['таблетки', 'капсулы', 'сироп', 'мазь', 'капли', 'спрей', 'раствор', 'порошок'] },
        { key: 'active', type: 'text', label: 'Действующее вещество' },
    ],
    formatSubtitle: ({ subtitle, data }) => {
        const parts = [data.dosage, data.form, subtitle || data.active]
        return parts.filter(Boolean).join(' · ') || undefined
    },
    sortOptions: [
        { key: 'expiry', label: 'По сроку годности' },
    ],
    starterCategories: [
        'Обезболивающие', 'Простуда', 'ЖКТ', 'Аллергия', 'Антисептики', 'Витамины', 'Первая помощь',
    ],
}
