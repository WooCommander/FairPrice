import { ref, readonly } from 'vue'
import { CollectionShareService } from '../services/CollectionShareService'
import type { CollectionShare, ShareInviteDTO, ShareRole } from '../domain/Share'

const activeCollectionId = ref<string | null>(null)
const shares = ref<CollectionShare[]>([])
const isLoading = ref(false)

export const useCollectionSharesStore = () => {
    const load = async (collectionId: string, force = false) => {
        if (activeCollectionId.value === collectionId && !force && shares.value.length) return

        activeCollectionId.value = collectionId
        isLoading.value = true
        try {
            shares.value = await CollectionShareService.fetchShares(collectionId)
        } catch (err) {
            console.error('Failed to fetch shares:', err)
            shares.value = []
        } finally {
            isLoading.value = false
        }
    }

    const invite = async (dto: ShareInviteDTO) => {
        const created = await CollectionShareService.invite(dto)
        shares.value.push(created)
        return created
    }

    const setRole = async (shareId: string, role: ShareRole) => {
        const updated = await CollectionShareService.updateRole(shareId, role)
        const idx = shares.value.findIndex(s => s.id === shareId)
        if (idx !== -1) shares.value[idx] = updated
        return updated
    }

    const revoke = async (shareId: string) => {
        await CollectionShareService.revoke(shareId)
        shares.value = shares.value.filter(s => s.id !== shareId)
    }

    const reset = () => {
        activeCollectionId.value = null
        shares.value = []
    }

    return {
        shares: readonly(shares),
        isLoading: readonly(isLoading),
        load,
        invite,
        setRole,
        revoke,
        reset,
    }
}
