import { ref, readonly } from 'vue'
import { CatalogService } from '../services/CatalogService'
import { type ProductModel, adaptProduct } from '../adapters/CatalogAdapter'

const searchResults = ref<ProductModel[]>([])
const currentProduct = ref<ProductModel | null>(null)
const isSearching = ref(false)

export const catalogStore = {
    searchResults: readonly(searchResults),
    currentProduct: readonly(currentProduct),
    isSearching: readonly(isSearching),

    async searchProducts(query: string, filters?: { category?: string, sort?: string }) {
        // Always run search to allow showing all products if query is empty

        isSearching.value = true
        try {
            const dtos = await CatalogService.searchProducts(query, filters)
            searchResults.value = dtos.map(adaptProduct)
        } finally {
            isSearching.value = false
        }
    },

    async loadProductById(id: string) {
        const dto = await CatalogService.getProductById(id)
        if (dto) {
            currentProduct.value = adaptProduct(dto)
        } else {
            currentProduct.value = null
        }
    },

    clearSearch() {
        searchResults.value = []
    },

    async createProduct(data: { name: string, category: string, unit: string }) {
        isSearching.value = true
        try {
            const dto = await CatalogService.createProduct(data)
            currentProduct.value = adaptProduct(dto)
            // Functionally, we might want to also add it to search results or history, 
            // but setting currentProduct is enough to proceed to step 2
        } finally {
            isSearching.value = false
        }
    }
}

