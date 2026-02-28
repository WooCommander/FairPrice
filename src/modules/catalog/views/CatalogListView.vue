<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { catalogStore } from '../store/catalogStore'
import { useRouter } from 'vue-router'
import { PRODUCT_CATEGORIES } from '../constants'
import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'

const router = useRouter()
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)

const products = computed(() => catalogStore.searchResults.value)
const isLoading = computed(() => catalogStore.isLoading.value)

const handleSearch = () => {
  catalogStore.searchProducts(searchQuery.value, {
    category: selectedCategory.value || undefined
  })
}

const toggleCategory = (cat: string) => {
  selectedCategory.value = selectedCategory.value === cat ? null : cat
}

// Watch for changes in search query and selected category to trigger search
watch([searchQuery, selectedCategory], () => {
  handleSearch()
})

onMounted(() => {
  handleSearch()
})

const addPrice = (productId: string) => {
  router.push(`/add-price/${productId}`)
}
</script>

<template>
  <div class="catalog-list-view">
    <div class="page-title-row">
      <h1 class="page-title">Каталог товаров</h1>
      <FpButton size="sm" @click="router.push('/create-product')">Добавить</FpButton>
    </div>

    <div class="sticky-search-wrapper">
      <div class="search-input-group">
        <FpInput v-model="searchQuery" placeholder="Поиск товара..." @keydown.enter="handleSearch" class="flex-grow" />
      </div>

      <div class="category-filters">
        <button v-for="cat in PRODUCT_CATEGORIES" :key="cat" class="category-tag"
          :class="{ active: selectedCategory === cat }" @click="toggleCategory(cat)">
          {{ cat }}
        </button>
      </div>
    </div>

    <section class="list-section">
      <div v-if="isLoading && products.length === 0" class="standard-grid">
        <div v-for="i in 6" :key="i" class="fp-tile skeleton">
          <div class="tile-info">
            <div class="skeleton-line sm"></div>
            <div class="skeleton-line lg"></div>
          </div>
        </div>
      </div>

      <div v-else-if="products.length === 0" class="empty">
        <div class="empty-icon">🔍</div>
        <h3>Ничего не нашли</h3>
        <p>Попробуйте изменить запрос или категорию</p>
        <FpButton v-if="searchQuery || selectedCategory" variant="outline" size="sm"
          @click="searchQuery = ''; selectedCategory = null">
          Сбросить фильтры
        </FpButton>
      </div>

      <div v-else class="standard-grid">
        <div v-for="product in products" :key="product.id" class="fp-tile"
          @click="router.push(`/product/${product.id}`)">
          <div class="tile-info">
            <span class="subtitle">{{ product.category }}</span>
            <h3 class="title">{{ product.name }}</h3>
          </div>

          <div class="tile-footer">
            <span class="main-value">{{ product.formattedPrice }}</span>
            <FpButton size="sm" variant="secondary" @click.stop="addPrice(product.id)">
              + Цена
            </FpButton>
          </div>
        </div>
      </div>

      <div v-if="catalogStore.hasMore.value" class="load-more">
        <FpButton variant="outline" :loading="isLoading" @click="catalogStore.loadMore()">
          Загрузить еще
        </FpButton>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.catalog-list-view {
  padding: 0 0.5rem;
}

.empty {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  h3 {
    margin: 0;
    font-size: 18px;
    color: var(--color-text-primary);
  }

  p {
    margin: 0 0 16px 0;
    font-size: 14px;
    max-width: 240px;
  }
}

.load-more {
  margin: 2rem 0;
  display: flex;
  justify-content: center;
  padding-bottom: 3rem;
}
</style>
