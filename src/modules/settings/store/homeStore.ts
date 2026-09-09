import { ref, readonly } from 'vue'

export interface HomeBlock {
    key: string
    label: string
    description?: string
    defaultOn: boolean
}

/** Registry of toggleable blocks on the Home dashboard, in display order. */
export const HOME_BLOCKS: HomeBlock[] = [
    { key: 'profile', label: 'Профиль и уровень', defaultOn: true },
    { key: 'stats', label: 'Мини-статистика', description: 'Список, избранное, вклад', defaultOn: true },
    { key: 'collections', label: 'Мои каталоги', description: 'Книги, аптечка и др.', defaultOn: true },
    { key: 'birthdays', label: 'Ближайшие праздники', defaultOn: true },
    { key: 'notes', label: 'Последняя заметка', defaultOn: true },
    { key: 'actions', label: 'Быстрые действия', defaultOn: true },
    { key: 'globalStats', label: 'Общая статистика приложения', defaultOn: true },
]

const STORAGE_KEY = 'fp_home_blocks'

const readOverrides = (): Record<string, boolean> => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}
    } catch {
        return {}
    }
}

const overrides = ref<Record<string, boolean>>(readOverrides())

const persist = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides.value))
    } catch {
        /* private mode / storage disabled — ignore */
    }
}

const defaultFor = (key: string) => HOME_BLOCKS.find(b => b.key === key)?.defaultOn ?? true

export const homeStore = {
    blocks: HOME_BLOCKS,
    overrides: readonly(overrides),

    isVisible(key: string): boolean {
        const o = overrides.value
        return key in o ? o[key] : defaultFor(key)
    },

    setVisible(key: string, on: boolean) {
        overrides.value = { ...overrides.value, [key]: on }
        persist()
    },

    reset() {
        overrides.value = {}
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {
            /* ignore */
        }
    },
}
