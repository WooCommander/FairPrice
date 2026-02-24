import { catalogStore } from '@/modules/catalog/store/catalogStore'

class AppService {
    /**
     * Оркестрация: после добавления цены необходимо обновить данные каталога
     * для отображения актуального фида и статистики товара.
     */
    async onPriceAdded(productId: string, price: number, storeName: string, quantityUnit: string) {
        await catalogStore.registerPriceUpdate(productId, price, storeName, quantityUnit)
    }

    // --- Оркестрация для модуля Цен при работе с товарами и магазинами ---

    get catalogSearchResults() { return catalogStore.searchResults }
    get catalogCurrentProduct() { return catalogStore.currentProduct }
    get catalogIsSearching() { return catalogStore.isSearching }

    async searchProducts(query: string) { return catalogStore.searchProducts(query) }
    async loadProductById(id: string) { return catalogStore.loadProductById(id) }
    async createProduct(data: { name: string, category: string, unit: string }) { return catalogStore.createProduct(data) }
    clearProductSearch() { catalogStore.clearSearch() }
    async getStoreName(id: string) { return catalogStore.getStoreName(id) }
}

export const appService = new AppService()

