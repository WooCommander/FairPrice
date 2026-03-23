<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { shoppingListStore } from '@/modules/shopping-list/state/shoppingListStore'
import { AuthService } from '@/modules/auth/services/AuthService'
import { usePriceFormat } from '@/composables/usePriceFormat'
import FpCard from '@/design-system/components/FpCard.vue'
import FpButton from '@/design-system/components/FpButton.vue'

const router = useRouter()

// Stats Data
// Destructure for easier use and reactivity in template
const {
    // recentUpdates,
    favoriteProductIds,
    // isFavorite,
    totalProductCount,
    totalCategoryCount,
    totalUserCount,
} = catalogStore

const { formatPrice } = usePriceFormat()
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

// Personalized Data
const userStats = ref<any>(null)
const userActivity = ref<any[]>([])
const isLoading = ref(true)

// const toggleFavorite = async (productId: string) => {
//     await catalogStore.toggleFavorite(productId)
// }

onMounted(async () => {
    isLoading.value = true
    try {
        const [stats, activity] = await Promise.all([
            AuthService.getUserStats(),
            AuthService.getUserActivity(5),
            catalogStore.loadFavorites(),
            catalogStore.loadDashboardStats(),
            shoppingListStore.loadItems ? shoppingListStore.loadItems() : Promise.resolve()
        ])
        userStats.value = stats
        userActivity.value = activity
    } catch (e) {
        console.error('Failed to load home data', e)
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="home-dashboard">
        <!-- Dashboard Hero: Personalized Profile -->
        <header class="dashboard-hero">
            <div class="hero-top">
                <div class="hero-content">
                    <h1 class="welcome-text">{{ greeting }}, <span class="accent">друг</span></h1>
                    <p class="hero-subtitle">Твой прогресс в Fair Price</p>
                </div>

            </div>

            <FpCard v-if="userStats" class="profile-card">
                <div class="profile-header">
                    <div class="level-badge">LVL {{ userStats.level }}</div>
                    <div class="profile-main">
                        <span class="level-title">{{ userStats.levelTitle }}</span>
                        <span class="points-text">{{ userStats.reputation }} очков репутации</span>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill"
                            :style="{ width: Math.min(100, (userStats.reputation / userStats.nextLevelThreshold) * 100) + '%' }">
                        </div>
                    </div>
                    <div class="progress-labels">
                        <span>{{ userStats.reputation }}</span>
                        <span>{{ userStats.nextLevelThreshold }}</span>
                    </div>
                </div>
            </FpCard>
        </header>

        <div class="dashboard-content">
            <!-- Personalized Stats -->
            <section class="stats-grid">
                <FpCard class="stat-card" @click="router.push('/shopping-list')">
                    <div class="stat-icon list">🛒</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ shoppingItemsLeft }}</span>
                        <span class="stat-label">В списке</span>
                    </div>
                </FpCard>

                <FpCard class="stat-card" @click="router.push('/favorites')">
                    <div class="stat-icon favorites">⭐</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ favoriteCount }}</span>
                        <span class="stat-label">Избранные</span>
                    </div>
                </FpCard>

                <FpCard v-if="userStats" class="stat-card contribution">
                    <div class="stat-icon contr">🏷️</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ userStats.pricesSubmitted }}</span>
                        <span class="stat-label">Вклад</span>
                    </div>
                </FpCard>
            </section>

            <!-- Global Insights (Small) -->
            <div class="global-mini-stats">
                <div class="mini-stat">
                    <span>📦<br> {{ totalProductCount }}<br> товаров</span>
                </div>
                <div class="mini-stat">
                    <span>👥<br> {{ totalUserCount }}<br> контрибьюторов</span>
                </div>
                <div class="mini-stat">
                    <span>📂<br> {{ totalCategoryCount }}<br> категорий</span>
                </div>
            </div>

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

            <!-- My Activity Feed -->
            <section class="activity-section">
                <div class="section-header">
                    <h2 class="section-title">Моя активность 🕒</h2>
                </div>

                <div v-if="isLoading" class="skeleton-list">
                    <div v-for="i in 3" :key="i" class="skeleton-row-card skeleton"></div>
                </div>

                <div v-else-if="userActivity.length === 0" class="empty-state">
                    <span class="icon">🏷️</span>
                    <p>Ты еще не добавлял цены. Начни экономить вместе с нами!</p>
                    <FpButton variant="primary" @click="router.push('/add-price')">Добавить первую цену</FpButton>
                </div>

                <div v-else class="activity-feed">
                    <div v-for="act in userActivity" :key="act.id" class="activity-tile"
                        @click="router.push(`/product/${act.productId}`)">
                        <div class="act-icon">{{ act.icon }}</div>
                        <div class="act-main">
                            <span class="act-title">{{ act.item }}</span>
                            <span class="act-meta">{{ act.action }} за {{ formatPrice(act.price) }}</span>
                        </div>
                        <div class="act-side">
                            <span class="act-time">{{ act.time }}</span>
                        </div>
                    </div>
                    <FpButton variant="text" size="sm" class="full-history-btn" @click="router.push('/activity')">Вся
                        история</FpButton>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped lang="scss">
// Hero Section Refined
.dashboard-hero {
    padding: var(--spacing-sm);
    background: linear-gradient(180deg, rgba(var(--color-primary-rgb), 0.12) 0%, transparent 100%);
    display: flex;
    flex-direction: column;
    gap: 20px;

    .hero-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .hero-content {
        margin: 0;
    }

    .welcome-text {
        font-size: 24px;
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.5px;

        .accent {
            color: var(--color-primary);
        }
    }

    .hero-subtitle {
        font-size: 14px;
        color: var(--color-text-secondary);
        margin: 4px 0 0;
    }

}

// Profile Card
.profile-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: var(--shadow-md);
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.level-badge {
    background: var(--color-primary);
    color: white;
    font-size: 12px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 20px;
    box-shadow: 0 4px 8px rgba(var(--color-primary-rgb), 0.3);
}

.profile-main {
    display: flex;
    flex-direction: column;

    .level-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--color-text-primary);
    }

    .points-text {
        font-size: 12px;
        color: var(--color-text-tertiary);
    }
}

.progress-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.progress-bar {
    height: 6px;
    background: var(--color-background);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-variant));
    border-radius: 3px;
    transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-tertiary);
}

.dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding: 0 var(--spacing-sm) 40px;
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
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:active {
            transform: scale(0.95);
        }

        &.contribution {
            background: rgba(var(--color-primary-rgb), 0.03);
            border-color: rgba(var(--color-primary-rgb), 0.1);
        }
    }

    .stat-icon {
        font-size: 18px;
        width: 32px;
        height: 32px;
        background: var(--color-background);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .stat-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: .1rem;
    }

    .stat-value {
        font-size: 18px;

        font-weight: 800;
        color: var(--color-text-primary);
    }

    .stat-label {
        font-size: 9px;
        font-weight: 700;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
}

.global-mini-stats {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 0 4px;

    .mini-stat {
        font-size: 1rem;
        color: var(--color-text-tertiary);
        font-weight: 600;
        background: var(--color-surface);
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid var(--color-border);
        flex: 1;
        text-align: center;
    }
}

// Activity Feed
.activity-feed {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.activity-tile {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s;

    &:active {
        background: var(--color-surface-hover);
    }

    .act-icon {
        font-size: 20px;
        width: 40px;
        height: 40px;
        background: var(--color-background);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .act-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;

        .act-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .act-meta {
            font-size: 12px;
            color: var(--color-text-secondary);
        }
    }

    .act-side {
        .act-time {
            font-size: 11px;
            color: var(--color-text-tertiary);
        }
    }
}

.full-history-btn {
    margin-top: 8px;
    width: 100%;
}

.actions-row {
    display: flex;
    justify-content: space-around;
    padding: 8px 0;

    .action-btn-circle {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        cursor: pointer;

        .icon {
            width: 48px;
            height: 48px;
            background: var(--color-primary);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
            transition: all 0.2s;
        }

        .label {
            font-size: 11px;
            font-weight: 600;
            color: var(--color-text-primary);
        }

        &:active .icon {
            transform: scale(0.9);
        }
    }
}

.empty-state {
    text-align: center;
    padding: 32px 20px;
    background: var(--color-surface);
    border-radius: 16px;
    border: 1px dashed var(--color-border);
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .icon {
        font-size: 32px;
        opacity: 0.5;
    }

    p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
    }
}

.skeleton-row-card {
    height: 64px;
    border-radius: 12px;
    background: var(--color-surface);
}
</style>
```
