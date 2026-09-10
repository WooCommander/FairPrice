import { ref, computed, readonly } from 'vue'
import { checkForUpdate, installUpdate, type UpdateInfo } from './UpdateService'

const DISMISS_KEY = 'fp_update_dismissed_version'

const available = ref<UpdateInfo | null>(null)
const dismissedVersion = ref<string>(safeGet())

function safeGet(): string {
    try {
        return localStorage.getItem(DISMISS_KEY) || ''
    } catch {
        return ''
    }
}

export const updateStore = {
    /** the update we found, or null when up to date / on web */
    available: readonly(available),
    currentVersion: __APP_VERSION__,

    hasUpdate: computed(() => !!available.value?.hasUpdate),

    /** show the floating banner only until the user dismisses this specific version */
    bannerVisible: computed(
        () =>
            !!available.value?.hasUpdate &&
            available.value?.version !== dismissedVersion.value,
    ),

    async check() {
        const r = await checkForUpdate()
        available.value = r.hasUpdate ? r : null
    },

    /** hide the banner for the currently offered version (persists) */
    dismiss() {
        const v = available.value?.version
        if (!v) return
        dismissedVersion.value = v
        try {
            localStorage.setItem(DISMISS_KEY, v)
        } catch {
            /* ignore */
        }
    },

    install() {
        if (available.value?.apkUrl) installUpdate(available.value.apkUrl)
    },
}
