<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { shoppingListStore } from '@/modules/shopping-list/state/shoppingListStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpInput from '@/design-system/components/FpInput.vue'

const router = useRouter()

// Stats Data
// Destructure for easier use and reactivity in template
const { recentUpdates, favoriteProductIds, isFavorite } = catalogStore
const { uncheckedItems } = shoppingListStore

const shoppingItemsLeft = computed(() => uncheckedItems.value.length)
const favoriteCount = computed(() => favoriteProductIds.value.size)
// Welcome Greeting
const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 6) return 'Доброй ночи'
    if (hour < 12) return 'Доброе утро'
    if (hour < 18) return 'Добрый день'
    return 'Добрый вечер'
})

// Search
const searchQuery = ref('')
const showFavoritesOnly = ref(false)
const isLoading = ref(true)

const handleSearch = () => {
    if (searchQuery.value.trim()) {
        router.push({ path: '/search', query: { q: searchQuery.value } })
    }
}

// Stats Helpers
const favoriteProducts = computed(() =>
    recentUpdates.value.filter(p => isFavorite(p.id))
)

const goodDeals = computed(() =>
    favoriteProducts.value.filter(p => p.priceStatus === 'good')
)

// Main List Filtering
const filteredUpdates = computed(() => {
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        return recentUpdates.value.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
    }

    if (showFavoritesOnly.value) {
        return favoriteProducts.value
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
            catalogStore.loadFavorites(),
            // Ensure shopping list is loaded for stats
            shoppingListStore.loadItems ? shoppingListStore.loadItems() : Promise.resolve()
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
        <!-- Dashboard Hero -->
        <header class="dashboard-hero">
            <div class="hero-content">
                <h1 class="welcome-text">{{ greeting }}, <span class="accent">друг</span></h1>
                <p class="hero-subtitle">Сегодня отличный день для экономных покупок!</p>
            </div>

            <div class="sticky-search-wrapper home-search">
                <div class="search-input-group">
                    <FpInput v-model="searchQuery" placeholder="Найти лучший товар..." @keydown.enter="handleSearch"
                        class="flex-grow" />
                </div>
            </div>
        </header>

        <div class="dashboard-content">
            <!-- Stats Grid -->
            <section class="stats-grid">
                <FpCard class="stat-card" @click="router.push('/shopping-list')">
                    <div class="stat-icon list">🛒</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ shoppingItemsLeft }}</span>
                        <span class="stat-label">В списке</span>
                    </div>
                </FpCard>

                <FpCard class="stat-card" @click="showFavoritesOnly = true">
                    <div class="stat-icon favorites">⭐</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ favoriteCount }}</span>
                        <span class="stat-label">Избранных</span>
                    </div>
                </FpCard>

                <FpCard class="stat-card spotlight" :class="{ pulse: goodDeals.length > 0 }">
                    <div class="stat-icon deals">🔥</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ goodDeals.length }}</span>
                        <span class="stat-label">Скидки</span>
                    </div>
                </FpCard>
            </section>

            <!-- Quick Actions -->
            <section class="actions-row">
                <button class="action-btn-circle" @click="router.push('/add-price')" title="Добавить цену">
                    <span class="icon">+</span>
                    <span class="label">Цена</span>
                </button>
                <button class="action-btn-circle" @click="router.push('/catalog')" title="Каталог">
                    <span class="icon">📦</span>
                    <span class="label">Каталог</span>
                </button>
                <button class="action-btn-circle" @click="router.push('/stores')" title="Магазины">
                    <span class="icon">🏪</span>
                    <span class="label">Магазины</span>
                </button>
                <button class="action-btn-circle" @click="router.push('/shopping-list')" title="Список покупок">
                    <span class="icon">📝</span>
                    <span class="label">Список</span>
                </button>
            </section>

            <!-- Best Deals Watchlist -->
            <section v-if="goodDeals.length > 0" class="deals-watchlist-section">
                <div class="section-header">
                    <h2 class="section-title">Лучшие цены сейчас 🔥</h2>
                </div>
                <div class="deals-scroller">
                    <div v-for="item in goodDeals" :key="item.id" class="deal-tile"
                        @click="router.push(`/product/${item.id}`)">
                        <div class="deal-tag">Выгодно</div>
                        <div class="deal-content">
                            <span class="deal-title">{{ item.displayName }}</span>
                            <div class="deal-price-row">
                                <span class="deal-price">{{ item.formattedPrice }}</span>
                                <span class="deal-store">🏪 {{ item.lastStore }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Updates Feed -->
            <section class="updates-section">
                <div class="section-header">
                    <div class="feed-tabs">
                        <button class="tab-btn" :class="{ active: !showFavoritesOnly }"
                            @click="showFavoritesOnly = false">Все обновления</button>
                        <button class="tab-btn" :class="{ active: showFavoritesOnly }"
                            @click="showFavoritesOnly = true">Избранное</button>
                    </div>
                </div>

                <div v-if="isLoading">
                    <div class="skeleton-list">
                        <div v-for="i in 5" :key="i" class="skeleton-row-card skeleton">
                            <div class="sk-line lg"></div>
                            <div class="sk-row">
                                <div class="sk-line md"></div>
                                <div class="sk-line sm"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else-if="filteredUpdates.length === 0" class="empty-state">
                    <template v-if="searchQuery">
                        <p class="empty-text">Ничего не найдено</p>
                        <button class="search-global-btn" @click="handleSearch">
                            Искать в каталогах
                        </button>
                    </template>
                    <template v-else>
                        <span>{{ showFavoritesOnly ? 'В избранном пока пусто' : 'Нет последних обновлений' }}</span>
                    </template>
                </div>

                <div v-else class="updates-feed">
                    <div v-for="item in filteredUpdates" :key="item.id" class="feed-tile"
                        @click="router.push(`/product/${item.id}`)">
                        <div class="tile-main">
                            <div class="tile-title-row">
                                <span class="tile-title">{{ item.displayName }}</span>
                                <button class="fav-icon-btn" :class="{ active: isFavorite(item.id) }"
                                    @click.stop="toggleFavorite(item.id)">
                                    ⭐
                                </button>
                            </div>
                            <span class="tile-meta">{{ item.category }} • {{ item.lastStore }}</span>
                        </div>
                        <div class="tile-side">
                            <span class="tile-price" :class="item.priceStatus">{{ item.formattedPrice }}</span>
                            <span class="tile-time">{{ item.lastUpdateRelative }}</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped lang="scss">
.home-dashboard {
    padding-bottom: 80px;
}

// Hero Section
.dashboard-hero {
    padding: 32px 20px 0;
    background: linear-gradient(180deg, rgba(var(--color-primary-rgb), 0.08) 0%, transparent 100%);

    .hero-content {
        margin-bottom: 24px;
    }

    .welcome-text {
        font-size: 28px;
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.5px;

        .accent {
            color: var(--color-primary);
        }
    }

    .hero-subtitle {
        font-size: 15px;
        color: var(--color-text-secondary);
        margin: 4px 0 0;
    }
}

.home-search {
    background: transparent !important;
    border-bottom: none !important;
    padding: 0 !important;
    margin: 0 !important;
}

.dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 20px;
}

// Stats Grid
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .stat-card {
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 4px;
        cursor: pointer;
        transition: transform 0.2s;

        &:active {
            transform: scale(0.95);
        }

        &.spotlight {
            background: linear-gradient(135deg, var(--color-surface) 0%, rgba(var(--color-success-rgb), 0.05) 100%);
            border-color: rgba(var(--color-success-rgb), 0.2);
        }
    }

    .stat-icon {
        font-size: 20px;
        width: 36px;
        height: 36px;
        background: var(--color-background);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .stat-value {
        font-size: 18px;
        font-weight: 800;
        color: var(--color-text-primary);
    }

    .stat-label {
        font-size: 10px;
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
}

// Pulsing effect for deals
.pulse {
    animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
    0% {
        box-shadow: 0 0 0 0 rgba(var(--color-success-rgb), 0.4);
    }

    70% {
        box-shadow: 0 0 0 6px rgba(var(--color-success-rgb), 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(var(--color-success-rgb), 0);
    }
}

// Actions Row
.actions-row {
    display: flex;
    justify-content: space-between;
    padding: 0 10px;

    .action-btn-circle {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        cursor: pointer;
        width: 64px;

        .icon {
            width: 52px;
            height: 52px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: var(--shadow-sm);
            transition: all 0.2s;
        }

        .label {
            font-size: 11px;
            font-weight: 500;
            color: var(--color-text-secondary);
        }

        &:hover .icon {
            background: var(--color-surface-hover);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        &:active .icon {
            transform: scale(0.9);
        }
    }
}

// Deals Watchlist
.deals-watchlist-section {
    .section-title {
        font-size: 17px;
        font-weight: 700;
        margin: 0 0 12px;
        padding-left: 4px;
    }
}

.deals-scroller {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 4px;
    margin: 0 -20px;
    padding-left: 20px;
    padding-right: 20px;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
        display: none;
    }

    .deal-tile {
        flex-shrink: 0;
        width: 160px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: 12px;
        position: relative;
        cursor: pointer;
        box-shadow: var(--shadow-sm);

        .deal-tag {
            position: absolute;
            top: -8px;
            right: 12px;
            background: var(--color-success);
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .deal-title {
            display: block;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            height: 36px;
        }

        .deal-price {
            display: block;
            font-size: 18px;
            font-weight: 800;
            color: var(--color-success);
        }

        .deal-store {
            font-size: 11px;
            color: var(--color-text-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

// Feed Section
.updates-section {
    .section-header {
        margin-bottom: 16px;
    }
}

.feed-tabs {
    display: flex;
    gap: 8px;
    background: var(--color-surface);
    padding: 4px;
    border-radius: 12px;
    border: 1px solid var(--color-border);
}

.tab-btn {
    flex: 1;
    background: none;
    border: none;
    padding: 8px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: all 0.2s;

    &.active {
        background: var(--color-background);
        color: var(--color-primary);
        box-shadow: var(--shadow-sm);
    }
}

.updates-feed {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.feed-tile {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: transform 0.1s;

    &:active {
        transform: scale(0.98);
    }

    .tile-main {
        flex: 1;
        min-width: 0;
    }

    .tile-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }

    .tile-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .fav-icon-btn {
        background: none;
        border: none;
        padding: 0;
        font-size: 14px;
        opacity: 0.2;
        filter: grayscale(1);

        &.active {
            opacity: 1;
            filter: none;
        }
    }

    .tile-meta {
        font-size: 12px;
        color: var(--color-text-secondary);
    }

    .tile-side {
        text-align: right;
        margin-left: 16px;
    }

    .tile-price {
        display: block;
        font-size: 16px;
        font-weight: 700;

        &.good {
            color: var(--color-success);
        }

        &.bad {
            color: var(--color-error);
        }
    }

    .tile-time {
        font-size: 11px;
        color: var(--color-text-tertiary);
    }
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    background: var(--color-surface);
    border-radius: 16px;
    border: 1px dashed var(--color-border);
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.search-global-btn {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 600;
}

.skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.skeleton-row-card {
    padding: 16px;
    border-radius: 16px;
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>
