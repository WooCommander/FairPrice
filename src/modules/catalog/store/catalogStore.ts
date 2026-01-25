import { ref, readonly } from 'vue'
import type { Product } from '../services/CatalogService'

const searchResults = ref<Product[]>([])
const currentProduct = ref<Product | null>(null)
const isSearching = ref(false)

export const catalogStore = {
    searchResults: readonly(searchResults),
    currentProduct: readonly(currentProduct),
    isSearching: readonly(isSearching),

    setSearchResults(results: Product[]) {
        searchResults.value = results
    },

    setCurrentProduct(product: Product | null) {
        currentProduct.value = product
    },

    setSearching(value: boolean) {
        isSearching.value = value
    }
}
