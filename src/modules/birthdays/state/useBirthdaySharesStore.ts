import { ref, readonly } from 'vue'
import { BirthdayShareService } from '../services/BirthdayShareService'
import type {
    BirthdayShare,
    BirthdayShareInviteDTO,
    BirthdayShareUpdateDTO,
} from '../domain/Share'

const shares = ref<BirthdayShare[]>([])
const isLoading = ref(false)
const isLoaded = ref(false)

export const useBirthdaySharesStore = () => {
    const load = async (force = false) => {
        if (isLoaded.value && !force) return
        isLoading.value = true
        try {
            shares.value = await BirthdayShareService.fetchMyShares()
            isLoaded.value = true
        } catch (err) {
            console.error('Failed to fetch birthday shares:', err)
            shares.value = []
        } finally {
            isLoading.value = false
        }
    }

    const invite = async (dto: BirthdayShareInviteDTO) => {
        const created = await BirthdayShareService.invite(dto)
        shares.value.push(created)
        return created
    }

    const updateShare = async (id: string, dto: BirthdayShareUpdateDTO) => {
        await BirthdayShareService.updateShare(id, dto)
        const idx = shares.value.findIndex(s => s.id === id)
        if (idx !== -1) {
            shares.value[idx] = {
                ...shares.value[idx],
                scope: dto.scope,
                birthday_ids: dto.scope === 'selected' ? dto.birthday_ids : [],
            }
        }
    }

    const revoke = async (id: string) => {
        await BirthdayShareService.revoke(id)
        shares.value = shares.value.filter(s => s.id !== id)
    }

    return {
        shares: readonly(shares),
        isLoading: readonly(isLoading),
        load,
        invite,
        updateShare,
        revoke,
    }
}
