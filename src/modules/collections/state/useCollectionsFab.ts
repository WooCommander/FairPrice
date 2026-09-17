import { ref } from 'vue'

export interface CollectionsFabAction {
	label: string
	onClick: () => void
}

const action = ref<CollectionsFabAction | null>(null)

/**
 * Lets the currently active collections screen (hub / catalog / item) publish the
 * "primary add action" that MainLayout's collections-mode bottom nav renders as its
 * single centered button. Views set it on mount (and clear it on unmount) instead of
 * rendering their own floating FpFab, so there is one add affordance, not two.
 */
export function useCollectionsFab() {
	const setFabAction = (next: CollectionsFabAction | null) => {
		action.value = next
	}

	return { action, setFabAction }
}
