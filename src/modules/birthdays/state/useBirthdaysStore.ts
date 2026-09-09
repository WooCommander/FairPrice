import { ref, readonly, computed } from 'vue'
import type { Birthday, BirthdayInsertDTO, BirthdayUpdateDTO } from '../domain/Birthday'
import { BirthdayService } from '../services/BirthdayService'
import { BirthdayShareService } from '../services/BirthdayShareService'
import { authStore } from '@/modules/auth/store/authStore'
import { getDaysUntilNext } from '../lib/birthdayUtils'

type SharedBirthday = Birthday & { owner_email: string | null }

const birthdays = ref<Birthday[]>([])
const sharedBirthdays = ref<SharedBirthday[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const byDaysLeft = (a: Birthday, b: Birthday) => {
    const da = getDaysUntilNext(a.day, a.month)
    const db = getDaysUntilNext(b.day, b.month)
    return da === db ? a.name.localeCompare(b.name) : da - db
}

export const useBirthdaysStore = () => {
    const fetchBirthdays = async () => {
        if (!authStore.user.value) {
            birthdays.value = []
            sharedBirthdays.value = []
            return
        }

        isLoading.value = true
        error.value = null
        try {
            await BirthdayShareService.linkShares()
            const [mine, shared] = await Promise.all([
                BirthdayService.fetchBirthdays(),
                BirthdayShareService.fetchSharedWithMe(),
            ])
            birthdays.value = mine
            sharedBirthdays.value = shared
        } catch (err: any) {
            console.error('Failed to fetch birthdays:', err)
            error.value = err.message || 'Ошибка загрузки дней рождений'
        } finally {
            isLoading.value = false
        }
    }

    const addBirthday = async (data: BirthdayInsertDTO) => {
        try {
            const newBirthday = await BirthdayService.createBirthday(data)
            birthdays.value.unshift(newBirthday)
            return newBirthday
        } catch (err: any) {
            console.error('Failed to add birthday:', err)
            throw err
        }
    }

    const editBirthday = async (id: string, updates: BirthdayUpdateDTO) => {
        try {
            const updated = await BirthdayService.updateBirthday(id, updates)
            const idx = birthdays.value.findIndex(b => b.id === id)
            if (idx !== -1) {
                birthdays.value[idx] = updated
            }
            return updated
        } catch (err: any) {
            console.error('Failed to edit birthday:', err)
            throw err
        }
    }

    const removeBirthday = async (id: string) => {
        try {
            await BirthdayService.deleteBirthday(id)
            birthdays.value = birthdays.value.filter(b => b.id !== id)
        } catch (err: any) {
            console.error('Failed to delete birthday:', err)
            throw err
        }
    }

    // Умная сортировка: сначала те, у кого скоро ДР (по кол-ву оставшихся дней)
    const sortedBirthdays = computed(() => [...birthdays.value].sort(byDaysLeft))

    // Дни рождения, которыми со мной поделились — сгруппированы по владельцу
    const sharedGroups = computed(() => {
        const groups = new Map<string, { ownerEmail: string; items: SharedBirthday[] }>()
        for (const b of sharedBirthdays.value) {
            const key = b.owner_email || b.user_id
            if (!groups.has(key)) {
                groups.set(key, { ownerEmail: b.owner_email || 'Другой пользователь', items: [] })
            }
            groups.get(key)!.items.push(b)
        }
        return [...groups.values()].map(g => ({
            ownerEmail: g.ownerEmail,
            items: [...g.items].sort(byDaysLeft),
        }))
    })

    return {
        birthdays: readonly(birthdays),
        sharedBirthdays: readonly(sharedBirthdays),
        sortedBirthdays,
        sharedGroups,
        isLoading: readonly(isLoading),
        error: readonly(error),
        fetchBirthdays,
        addBirthday,
        editBirthday,
        removeBirthday,
    }
}
