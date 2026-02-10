<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

onMounted(async () => {
    catalogStore.loadRecentProducts()
    recentSearches.value = await CatalogService.getPopularSearchTerms()
})
</script>

<template>
    <div class="home-dashboard">
        <!-- Header / Hero Section -->
        <header class="dashboard-header">
            <h1 class="page-title">Справедливая цена</h1>
            <p class="page-subtitle">Сравните цены в магазинах и на рынках.</p>

            <div class="search-bar-container">
                <input v-model="searchQuery" type="text" class="search-input" placeholder="Поиск товара..."
                    @keyup.enter="handleSearch" />
                <div class="search-icon" @click="handleSearch">🔍</div>
            </div>

            <div class="quick-links" v-if="recentSearches.length > 0">
                <span class="quick-link-label">Часто ищут:</span>
                <button v-for="tag in recentSearches" :key="tag" class="tag-link" @click="router.push('/search')">
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
                                <th class="text-right">Цена</th>
                                <th>Магазин</th>
                                <th class="text-right">Время</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in recentUpdates" :key="item.id" class="feed-row"
                                @click="router.push(`/product/${item.id}`)">
                                <td class="font-medium">{{ item.displayName }}</td>
                                <td class="text-right text-success font-bold">{{ item.formattedPrice }}</td>
                                <td class="text-secondary">{{ item.storeName }}</td>
                                <td class="text-right text-muted text-sm">{{ item.lastUpdateRelative }}</td>
                            </tr>
                        </tbody>
                    </table>
                </FpCard>
            </section>
        </div>
    </div>
</template>

<style scoped lang="scss">
.home-dashboard {
    /* max-width removed to use global layout */
    margin: 0 auto;
    padding: var(--spacing-xl) 0;
}

.dashboard-header {
    margin-bottom: var(--spacing-2xl);
    text-align: center;
}

.page-title {
    font-family: var(--font-heading);
    font-size: var(--text-h1); // Larger title
    font-weight: 700;
    margin: 0 0 var(--spacing-sm);
    color: var(--color-primary); // Use primary color
    letter-spacing: -0.5px;
}

.page-subtitle {
    font-size: var(--text-h5);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-xl);
    font-weight: 300;
}

.search-bar-container {
    position: relative;
    max-width: 500px;
    margin: 0 auto var(--spacing-lg);
}

.search-input {
    width: 100%;
    padding: 18px 24px 18px 52px;
    font-size: var(--text-body-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill); // Pill shape for classic modern feel
    outline: none;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);

    &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);
    }
}

.search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.5;
    font-size: 18px;
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
    grid-template-columns: repeat(3, 1fr); // Strict 3 columns
    gap: var(--spacing-lg);

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
}

.action-card {
    display: flex !important;
    align-items: center;
    gap: var(--spacing-md);
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    padding: var(--spacing-lg) !important;

    &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--color-primary);
    }
}

.action-icon {
    font-size: 24px;
    color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);
    padding: 12px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-details {
    display: flex;
    flex-direction: column;

    h3 {
        margin: 0;
        font-family: var(--font-heading);
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-primary);
    }

    span {
        font-size: var(--text-body-2);
        color: var(--color-text-secondary);
        margin-top: 2px;
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
}

.data-table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
        padding: 16px 24px; // More padding
        text-align: left;
    }

    th {
        font-size: 11px; // Smaller uppercase header
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
</style>
