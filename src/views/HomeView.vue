<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { shoppingListStore } from '@/modules/shopping-list/state/shoppingListStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpInput from '@/design-system/components/FpInput.vue'

const router = useRouter()

const shoppingItemsLeft = computed(() => shoppingListStore.uncheckedItems.value.length)
const { recentUpdates } = catalogStore

// Use a subset for HomeView
const searchQuery = ref('')
const showFavoritesOnly = ref(false)
const isLoading = ref(true)

const handleSearch = () => {
    if (searchQuery.value.trim()) {
        router.push({ path: '/search', query: { q: searchQuery.value } })
    }
}

const filteredUpdates = computed(() => {
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        return recentUpdates.value.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
    }

    if (showFavoritesOnly.value) {
        return recentUpdates.value.filter(p => catalogStore.isFavorite(p.id))
    }

    return recentUpdates.value
})

const toggleFavorite = async (productId: string) => {
    await catalogStore.toggleFavorite(productId)
}

onMounted(async () => {
    isLoading.value = true
    try {
        await Promise.all([
            catalogStore.loadRecentProducts(),
            catalogStore.loadFavorites()
        ])
    } catch (e) {
        console.error('Failed to load home data', e)
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="home-dashboard">
        <!-- Standardized Sticky Search -->
        <div class="sticky-search-wrapper home-search">
            <div class="search-input-group">
                <FpInput v-model="searchQuery" placeholder="Поищем что нибудь?..." @keydown.enter="handleSearch"
                    class="flex-grow" />
            </div>
        </div>

        <div class="dashboard-content">
            <!-- Main Actions -->
            <section class="actions-section">
                <!-- Card 1: Add Price -->
                <button class="action-card primary" @click="router.push('/add-price')">
                    <div class="icon-container">
                        <span>+</span>
                    </div>
                    <div class="text-content">
                        <span class="title">Добавить</span>
                    </div>
                </button>

                <!-- Card 2: Shopping List -->
                <button class="action-card secondary" @click="router.push('/shopping-list')">
                    <div class="icon-container list-icon">
                        <span>📝</span>
                        <div v-if="shoppingItemsLeft > 0" class="badge-dot">{{ shoppingItemsLeft }}</div>
                    </div>
                    <div class="text-content">
                        <span class="title">Список</span>
                        <span class="subtitle" v-if="shoppingItemsLeft > 0">{{ shoppingItemsLeft }} ост.</span>
                    </div>
                </button>

                <!-- Card 3: Catalog -->
                <button class="action-card" @click="router.push('/catalog')">
                    <div class="action-icon">📦</div>
                    <div class="text-content">
                        <span class="title">Каталог</span>
                    </div>
                </button>

                <!-- Card 4: Stores -->
                <button class="action-card" @click="router.push('/stores')">
                    <div class="action-icon">🏪</div>
                    <div class="text-content">
                        <span class="title">Магазины</span>
                    </div>
                </button>
            </section>

            <!-- Recent Updates Feed -->
            <section class="updates-section">
                <div class="section-header">
                    <div class="feed-tabs">
                        <button class="tab-btn" :class="{ active: !showFavoritesOnly }"
                            @click="showFavoritesOnly = false">Все</button>
                        <button class="tab-btn" :class="{ active: showFavoritesOnly }"
                            @click="showFavoritesOnly = true">Избранное</button>
                    </div>
                </div>

                <div v-if="isLoading">
                    <!-- Skeletons for Desktop -->
                    <div class="desktop-skeletons">
                        <FpCard v-for="i in 5" :key="i" class="skeleton-row-card">
                            <div class="skeleton-row skeleton">
                                <div class="sk-cell" style="width: 25%"></div>
                                <div class="sk-cell" style="width: 15%"></div>
                                <div class="sk-cell" style="width: 10%"></div>
                                <div class="sk-cell" style="width: 15%"></div>
                                <div class="sk-cell" style="width: 20%"></div>
                            </div>
                        </FpCard>
                    </div>
                    <!-- Skeletons for Mobile -->
                    <div class="mobile-skeletons">
                        <div v-for="i in 4" :key="i" class="mobile-skeleton-card skeleton">
                            <div class="sk-line lg"></div>
                            <div class="sk-row">
                                <div class="sk-line md"></div>
                                <div class="sk-line sm"></div>
                            </div>
                            <div class="skeleton-divider"></div>
                        </div>
                    </div>
                </div>

                <div v-else-if="filteredUpdates.length === 0" class="empty-state">
                    <template v-if="searchQuery">
                        <p class="empty-text">В последних обновлениях не найдено</p>
                        <button class="search-global-btn" @click="handleSearch">
                            Искать "{{ searchQuery }}" во всем каталоге
                        </button>
                    </template>
                    <template v-else>
                        <span v-if="showFavoritesOnly">В избранном пока пусто</span>
                        <span v-else>Нет последних обновлений</span>
                    </template>
                </div>

                <FpCard class="feed-table-card" padding="none" v-else>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Товар</th>
                                <th></th>
                                <th>Категория</th>
                                <th class="text-right">Цена</th>
                                <th class="text-right">Средняя (мес.)</th>
                                <th>Магазин</th>
                                <th class="text-right">Время</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in filteredUpdates" :key="item.id" class="feed-row"
                                @click="router.push(`/product/${item.id}`)">
                                <td class="font-medium">{{ item.displayName }}</td>
                                <td>
                                    <button class="fav-btn" :class="{ active: catalogStore.isFavorite(item.id) }"
                                        @click.stop="toggleFavorite(item.id)">
                                        <svg width="20" height="20" viewBox="0 0 24 24"
                                            :fill="catalogStore.isFavorite(item.id) ? 'currentColor' : 'none'"
                                            stroke="currentColor" stroke-width="2">
                                            <polygon
                                                points="12 2 15.09 8.26 21.78 9.27 16.94 14.14 18.18 21.02 12 17.77 5.82 21.02 7.06 14.14 2.22 9.27 8.91 8.26 12 2">
                                            </polygon>
                                        </svg>
                                    </button>
                                </td>
                                <td>
                                    <span class="category-tag-inline"
                                        @click.stop="router.push(`/category/${item.category}`)">
                                        {{ item.category }}
                                    </span>
                                </td>
                                <td class="text-right font-bold" :class="{
                                    'text-success': item.priceStatus === 'good',
                                    'text-error': item.priceStatus === 'bad',
                                    'text-neutral': item.priceStatus === 'neutral'
                                }">
                                    {{ item.formattedPrice }}
                                </td>
                                <td class="text-right font-medium text-secondary">
                                    {{ item.formattedAveragePrice || '-' }}
                                </td>
                                <td>
                                    <span class="store" @click.stop="router.push(`/store/${item.lastStoreId}`)"
                                        v-if="item.lastStoreId" role="link">
                                        🏪 {{ item.lastStore }}
                                    </span>
                                    <span class="store" v-else>
                                        🏪 {{ item.lastStore || 'Нет данных' }}
                                    </span>
                                </td>
                                <td class="text-right text-muted text-sm">{{ item.lastUpdateRelative }}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Mobile View -->
                    <div class="mobile-feed">
                        <div v-for="item in filteredUpdates" :key="item.id" class="mobile-feed-card"
                            @click="router.push(`/product/${item.id}`)">

                            <!-- Row 1: Title & Price -->
                            <div class="card-top">
                                <div class="title-with-fav">
                                    <button class="fav-btn" :class="{ active: catalogStore.isFavorite(item.id) }"
                                        @click.stop="toggleFavorite(item.id)">
                                        <svg width="20" height="20" viewBox="0 0 24 24"
                                            :fill="catalogStore.isFavorite(item.id) ? 'currentColor' : 'none'"
                                            stroke="currentColor" stroke-width="2">
                                            <polygon
                                                points="12 2 15.09 8.26 21.78 9.27 16.94 14.14 18.18 21.02 12 17.77 5.82 21.02 7.06 14.14 2.22 9.27 8.91 8.26 12 2">
                                            </polygon>
                                        </svg>
                                    </button>
                                    <span class="card-title">{{ item.displayName }}</span>
                                </div>
                                <div class="price-col">
                                    <span class="card-price" :class="{
                                        'text-success': item.priceStatus === 'good',
                                        'text-error': item.priceStatus === 'bad',
                                        'text-neutral': item.priceStatus === 'neutral'
                                    }">
                                        {{ item.formattedPrice }}
                                    </span>
                                </div>
                            </div>

                            <!-- Row 2: Unit Price & Store -->
                            <div class="card-middle">
                                <span v-if="item.formattedUnitPrice" class="unit-price-badge">
                                    {{ item.formattedUnitPrice }}
                                </span>
                                <span v-else></span> <!-- Spacer -->

                                <span class="store-text" @click.stop="router.push(`/store/${item.lastStoreId}`)"
                                    v-if="item.lastStoreId">
                                    🏪 {{ item.lastStore }}
                                </span>
                            </div>

                            <!-- Row 3: Category & Time -->
                            <div class="card-bottom">
                                <span class="category-tag-inline"
                                    @click.stop="router.push(`/category/${item.category}`)">
                                    {{ item.category }}
                                </span>
                                <span class="last-update">{{ item.lastUpdateRelative }}</span>
                            </div>
                        </div>
                    </div>
                </FpCard>
            </section>
        </div>
    </div>
</template>

<style scoped lang="scss">
.updates-section {
    margin: 0rem 1.25rem;
}

.home-dashboard {
    padding-bottom: var(--spacing-lg);
}

.home-search {
    margin-bottom: var(--spacing-lg);
}

.dashboard-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.actions-section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;

    @media (max-width: 600px) {
        display: flex;
        justify-content: space-evenly;
        gap: 8px;
    }
}

.action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    padding: 16px 8px;
    height: 100px;
    width: 100%;
    box-sizing: border-box;

    &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: rgba(var(--color-primary-rgb), 0.5);
    }

    @media (max-width: 600px) {
        width: 60px;
        height: 60px;
        padding: 0;
        border-radius: 50%;
        gap: 0;
    }
}

.icon-container,
.action-icon {
    font-size: 24px;
    background: var(--color-background);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-primary);

    @media (max-width: 600px) {
        background: transparent;
        width: 100%;
        height: 100%;
        font-size: 24px;
        position: relative;
    }
}

.badge-dot {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--color-error);
    color: white;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid var(--color-surface);
}

.text-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    @media (max-width: 600px) {
        display: none;
    }

    .title {
        font-weight: 600;
        font-size: var(--text-body-1);
        color: var(--color-text-primary);
        line-height: 1.2;
    }

    .subtitle {
        font-size: var(--text-caption);
        color: var(--color-text-secondary);
        line-height: 1.2;
        margin-top: 2px;
    }
}

.section-header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: var(--spacing-sm);
}

.feed-tabs {
    display: flex;
    gap: 8px;
    background: var(--color-surface);
    padding: 4px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
}

.tab-btn {
    background: none;
    border: none;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    font-size: var(--text-caption);
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all 0.2s;

    &.active {
        background: var(--color-primary);
        color: white;
        font-weight: 500;
    }
}

.empty-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-secondary);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
}

.search-global-btn {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        filter: brightness(0.9);
    }
}

.feed-table-card {
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    border-radius: var(--radius-md);
    background: var(--color-surface);

    @media (max-width: 600px) {
        background: transparent;
        border: none;
        box-shadow: none;
    }
}

.data-table {
    width: 100%;
    border-collapse: collapse;

    @media (max-width: 600px) {
        display: none;
    }

    th,
    td {
        padding: 16px 24px;
        text-align: left;
    }

    th {
        font-size: 1rem;
        color: var(--color-text-secondary);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: #fafafa;
        border-bottom: 1px solid var(--color-border);
    }

    tbody tr {
        border-bottom: 1px solid var(--color-border);
        transition: background-color 0.1s;

        &:last-child {
            border-bottom: none;
        }

        &:hover {
            background-color: var(--color-surface-hover);
        }
    }

    .feed-row {
        cursor: pointer;
    }
}

.text-right {
    text-align: right;
}

.font-medium {
    font-weight: 500;
}

.font-bold {
    font-weight: 700;
}

.text-success {
    color: var(--color-success);
}

.text-error {
    color: var(--color-error);
}

.text-neutral {
    color: var(--color-text-primary);
}

.text-secondary {
    color: var(--color-text-secondary);
}

.text-muted {
    color: var(--color-text-disabled);
}

.text-sm {
    font-size: var(--text-caption);
}

.category-tag-inline {
    background: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    font-size: var(--text-caption);
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background: rgba(var(--color-primary-rgb), 0.2);
    }
}

.mobile-feed {
    display: none;
    flex-direction: column;
    gap: 8px;

    @media (max-width: 600px) {
        display: flex;
    }
}

.mobile-feed-card {
    background: var(--color-surface);
    padding: 12px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: all 0.2s;
    margin: 0rem .5rem;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 12px;

    &:active {
        transform: scale(0.98);
        background-color: var(--color-surface-hover);
    }
}

.card-top {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.card-title {
    font-weight: 600;
    font-size: 15px;
    line-height: 1.3;
    color: var(--color-text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.price-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
}

.card-price {
    font-weight: 800;
    font-size: 18px;
    line-height: 1.2;
    white-space: nowrap;
}

.card-middle {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2px;
}

.unit-price-badge {
    font-size: 14px;
    color: var(--color-text-secondary);
}

.store-text {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--color-background);
    padding: 2px 6px;
    border-radius: 4px;
}

.card-bottom {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
}

.last-update {
    font-size: 12px;
    color: var(--color-text-tertiary);
}

.fav-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--color-text-disabled);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &.active {
        color: #FFD700;
    }

    &:hover {
        transform: scale(1.1);
    }
}

.title-with-fav {
    display: flex;
    align-items: flex-start;
    gap: 4px;

    .fav-btn {
        padding: 0;
        margin-top: -2px;
    }
}

// Skeleton Helper Classes
.skeleton-row-card {
    margin-bottom: 8px;
    border: 1px solid var(--color-border);
}

.skeleton-row {
    display: flex;
    gap: 16px;
    padding: 16px;
}

.mobile-skeleton-card {
    background: var(--color-surface);
    padding: 16px;
    border-radius: 12px;
    margin: 0 0.5rem 8px 0.5rem;
    border: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 12px;

    .sk-line {
        height: 14px;

        &.lg {
            width: 70%;
            height: 18px;
        }

        &.md {
            width: 40%;
        }

        &.sm {
            width: 20%;
        }
    }

    .sk-row {
        display: flex;
        justify-content: space-between;
    }

    .skeleton-divider {
        margin-top: 4px;
        border-top: 1px solid var(--color-border);
        padding-top: 8px;
    }
}

.desktop-skeletons {
    @media (max-width: 600px) {
        display: none;
    }
}

.mobile-skeletons {
    display: none;

    @media (max-width: 600px) {
        display: flex;
        flex-direction: column;
    }
}
</style>
