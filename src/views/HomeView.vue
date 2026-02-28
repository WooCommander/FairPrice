<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { shoppingListStore } from '@/modules/shopping-list/state/shoppingListStore'
import FpCard from '@/design-system/components/FpCard.vue'
import FpSearchInput from '@/design-system/components/FpSearchInput.vue'

const router = useRouter()

const shoppingItemsLeft = computed(() => shoppingListStore.uncheckedItems.value.length)
const { recentUpdates } = catalogStore

// Use a subset for HomeView
const searchQuery = ref('')
const showFavoritesOnly = ref(false)

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
    try {
        await Promise.all([
            catalogStore.loadRecentProducts(),
            catalogStore.loadFavorites()
        ])
    } catch (e) {
        console.error('Failed to load home data', e)
    }
})
</script>

<template>
    <div class="home-dashboard">
        <!-- Header / Hero Section -->
        <header class="dashboard-header">
            <div class="search-bar-container">
                <FpSearchInput v-model="searchQuery" placeholder="Поиск товара..." @keyup.enter="handleSearch"
                    @search="handleSearch" />
            </div>
        </header>

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
                        <span class="title">Места</span>
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

                <div v-if="filteredUpdates.length === 0" class="empty-state">
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
                                    <span class="category-tag" @click.stop="router.push(`/category/${item.category}`)">
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
                                <span class="category-tag" @click.stop="router.push(`/category/${item.category}`)">
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
    /* max-width handled by MainLayout */
    padding-bottom: var(--spacing-lg);
}

.dashboard-header {
    margin-bottom: var(--spacing-lg); // Compact margin
    text-align: center;
}

.search-bar-container {
    position: relative;
    margin: var(--spacing-sm);
}

.dashboard-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

// Actions Section
.actions-section {
    display: grid;
    grid-template-columns: repeat(4, 1fr); // 4 columns on desktop
    gap: 12px;
    // max-width: 900px;
    // 

    @media (max-width: 600px) {
        display: flex; // Flex row on mobile
        justify-content: space-evenly; // Distribute evenly
        gap: 8px;
    }
}

.action-card {
    display: flex;
    flex-direction: column; // Vertical layout
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
    height: 100px; // Fixed height for desktop
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
        border-radius: 50%; // Circular buttons
        gap: 0; // No gap since no text
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
        background: transparent; // Clean look
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
        display: none; // Hide text on mobile
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

// Updates Section
.section-header {
    display: flex;
    justify-content: center;
    align-items: center;
    // margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);


    h2 {
        font-family: var(--font-heading);
        font-size: var(--text-h3);
        font-weight: 600;
        margin: 0;
        color: var(--color-text-primary);
    }
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
        background: var(--color-primary-dark, #0056b3); // Fallback if var missing
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
        padding: 16px 24px; // More padding
        text-align: left;
    }

    th {
        font-size: 1rem; // Increased header size
        color: var(--color-text-secondary);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: #fafafa; // Light gray header
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

.category-tag {
    background: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    font-size: var(--text-caption);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: rgba(var(--color-primary-rgb), 0.2);
    }
}



.mobile-feed {
    display: none;
    flex-direction: column;
    gap: 8px; // Reduced gap between cards

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

    // Grid Layout
    display: grid;
    grid-template-columns: 1fr auto; // Content space | Price space
    grid-template-rows: auto auto auto; // Name | Details | Meta
    gap: 4px 12px; // row-gap col-gap

    &:active {
        transform: scale(0.98);
        background-color: var(--color-surface-hover);
    }
}

// Row 1: Name and Price
.card-top {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 2px;
}

.card-title {
    font-weight: 600;
    font-size: 15px; // Slightly smaller but bolder
    line-height: 1.3;
    color: var(--color-text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2; // Max 2 lines
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.price-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0; // Prevent price shrinking
}

.card-price {
    font-weight: 800; // Extra bold
    font-size: 18px;
    line-height: 1.2;
    white-space: nowrap;

    &.text-success {
        color: var(--color-success);
    }

    &.text-error {
        color: var(--color-error);
    }

    &.text-neutral {
        color: var(--color-text-primary);
    }
}

// Row 2: Secondary Info (Unit Price + Store)
.card-middle {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2px;
}

.unit-price-badge {
    font-size: 1rem;
    color: var(--color-text-secondary);
}

.store-text {
    font-size: 1rem;
    color: var(--color-text-primary);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--color-background);
    padding: 2px 6px;
    border-radius: 4px;
}

// Row 3: Meta (Category + Time)
.card-bottom {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border); // Separator
}

.category-tag {
    // Override existing slightly for mobile context
    font-size: 1rem;
    padding: 2px 8px;
}

.last-update {
    font-size: 1rem;
    color: var(--color-text-tertiary);
}

// Hide elements not used in new design if needed
.avg-price-badge {
    display: none; // Hide average price to reduce clutter on mobile
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
        color: #FFD700; // Gold
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
</style>
