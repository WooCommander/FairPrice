<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { CatalogService } from '@/modules/catalog/services/CatalogService'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'

const router = useRouter()

const { recentUpdates } = catalogStore

const recentSearches = ref<string[]>([])
const searchQuery = ref('')

const handleSearch = () => {
    if (searchQuery.value.trim()) {
        router.push({ path: '/search', query: { q: searchQuery.value } })
    }
}

const filteredUpdates = computed(() => {
    if (!searchQuery.value) return recentUpdates.value
    const q = searchQuery.value.toLowerCase()
    return recentUpdates.value.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
})

onMounted(async () => {
    catalogStore.loadRecentProducts()
    recentSearches.value = await CatalogService.getPopularSearchTerms()
})
</script>

<template>
    <div class="home-dashboard">
        <!-- Header / Hero Section -->
        <header class="dashboard-header">
            <div class="search-bar-container">
                <input v-model="searchQuery" type="text" class="search-input" placeholder="Поиск товара..."
                    @keyup.enter="handleSearch" />
                <div class="search-icon" @click="handleSearch">🔍</div>
            </div>

            <div class="quick-links" v-if="recentSearches.length > 0">
                <span class="quick-link-label">Часто ищут:</span>
                <button v-for="tag in recentSearches" :key="tag" class="tag-link"
                    @click="router.push({ path: '/search', query: { q: tag } })">
                    {{ tag }}
                </button>
            </div>
        </header>

        <div class="dashboard-content">
            <!-- Main Actions -->
            <section class="actions-section">
                <FpCard class="action-card" @click="router.push('/search')">
                    <div class="action-icon">🔎</div>
                    <div class="action-details">
                        <h3>Найти товар</h3>
                        <span>Поиск лучших цен</span>
                    </div>
                </FpCard>

                <FpCard class="action-card" @click="router.push('/add-price')">
                    <div class="action-icon">📝</div>
                    <div class="action-details">
                        <h3>Добавить цену</h3>
                        <span>Внести вклад в базу</span>
                    </div>
                </FpCard>

                <FpCard class="action-card" @click="router.push('/add-price')">
                    <div class="action-icon">⭐</div>
                    <div class="action-details">
                        <h3>Избранное</h3>
                        <span>Ваши списки</span>
                    </div>
                </FpCard>
            </section>

            <!-- Recent Updates Feed -->
            <section class="updates-section">
                <div class="section-header">
                    <h2>Последние обновления</h2>
                    <FpButton variant="text" size="sm">Смотреть все</FpButton>
                </div>

                <FpCard class="feed-table-card" padding="none">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Товар</th>
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
                                    <span class="category-tag" @click.stop="router.push(`/category/${item.category}`)">
                                        {{ item.category }}
                                    </span>
                                </td>
                                <td class="text-right text-success font-bold">{{ item.formattedPrice }}</td>
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
                            <div class="card-top">
                                <span class="card-title">{{ item.displayName }}</span>
                                <div class="price-col">
                                    <span class="card-price">{{ item.formattedPrice }}</span>
                                    <span v-if="item.formattedAveragePrice" class="avg-price-badge">
                                        {{ item.formattedAveragePrice }}
                                    </span>
                                </div>
                            </div>
                            <div class="card-middle">
                                <span class="category-tag" @click.stop="router.push(`/category/${item.category}`)">
                                    {{ item.category }}
                                </span>
                                <span class="store-text" @click.stop="router.push(`/store/${item.lastStoreId}`)"
                                    v-if="item.lastStoreId">
                                    🏪 {{ item.lastStore }}
                                </span>
                            </div>
                            <div class="card-bottom">
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
.home-dashboard {
    /* max-width handled by MainLayout */
    padding-bottom: var(--spacing-lg);
}

.dashboard-header {
    margin-bottom: var(--spacing-xl); // Reduced bottom margin
    text-align: center;
}

.page-title {
    font-family: var(--font-heading);
    font-size: var(--text-h3); // Much smaller title
    font-weight: 700;
    margin: 0 0 var(--spacing-xs);
    color: var(--color-primary);
    letter-spacing: -0.5px;
}

.page-subtitle {
    font-size: var(--text-body-1); // Smaller subtitle
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-lg); // Reduced margin
    font-weight: 400;
}

.search-bar-container {
    position: relative;
    max-width: 600px; // Slightly wider for better look
    margin: 0 auto var(--spacing-md);
}

.search-input {
    width: 100%;
    padding: 12px 20px 12px 48px; // Compact padding
    font-size: 18px; // Increased for better readability
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    outline: none;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);

    &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
    }
}

.search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
    font-size: 16px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 1;
    }
}

.quick-links {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    align-items: center;
}

.quick-link-label {
    font-size: var(--text-caption);
    color: var(--color-text-disabled);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.tag-link {
    background: white;
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--text-caption);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    transition: all 0.2s;
    font-weight: 500;

    &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
        background: white;
    }
}

.dashboard-content {
    display: grid;
    gap: var(--spacing-2xl);
}

// Actions Section
.actions-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md); // Reduced gap
    max-width: 900px; // Slightly wider for desktop
    margin: 0 auto; // Center it

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
}

.action-card {
    display: flex !important;
    flex-direction: row; // Horizontal layout
    align-items: center;
    gap: var(--spacing-md);
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    padding: 12px 16px !important; // Compact padding
    min-height: 72px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: rgba(var(--color-primary-rgb), 0.5);
    }
}

.action-card:nth-child(1) .action-icon {
    background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.1), rgba(var(--color-primary-rgb), 0.2));
    color: var(--color-primary);
}

.action-card:nth-child(2) .action-icon {
    background: linear-gradient(135deg, rgba(var(--color-success-rgb), 0.1), rgba(var(--color-success-rgb), 0.2));
    color: var(--color-success);
}

.action-card:nth-child(3) .action-icon {
    background: linear-gradient(135deg, rgba(var(--color-warning-rgb), 0.1), rgba(var(--color-warning-rgb), 0.2));
    color: var(--color-warning);
}

.action-icon {
    font-size: 20px;
    color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);
    padding: 8px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.action-details {
    display: flex;
    flex-direction: column;
    justify-content: center;

    h3 {
        margin: 0;
        font-family: var(--font-heading);
        font-size: 18px; // Increased title size
        font-weight: 600;
        color: var(--color-text-primary);
        line-height: 1.2;
    }

    span {
        font-size: 14px; // Increased details size
        color: var(--color-text-secondary);
        margin-top: 2px;
        line-height: 1.2;
    }
}

// Updates Section
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 2px solid var(--color-border);

    h2 {
        font-family: var(--font-heading);
        font-size: var(--text-h3);
        font-weight: 600;
        margin: 0;
        color: var(--color-text-primary);
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
        font-size: 12px; // Increased header size
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
    gap: var(--spacing-sm);

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
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:active {
        transform: scale(0.98);
    }
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    font-weight: 600;
    font-size: var(--text-body-1);
    color: var(--color-text-primary);
}

.card-price {
    font-weight: 700;
    color: var(--color-success);
    font-size: 18px; // Increased price size
}

.price-col {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}

.avg-price-badge {
    font-size: 11px;
    background: var(--color-background);
    color: var(--color-text-secondary);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-weight: 500;
}

.card-middle {
    display: flex;
    align-items: center;
    gap: 12px;
}

.store-text {
    font-size: var(--text-caption);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
}

.card-bottom {
    display: flex;
    justify-content: flex-end;
}

.last-update {
    font-size: 12px; // Increased from 10px
    color: var(--color-text-disabled);
    text-transform: uppercase;
}
</style>
