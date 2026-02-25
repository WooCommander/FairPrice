<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AuthService } from '@/modules/auth/services/AuthService'
import FpCard from '@/design-system/components/FpCard.vue'

interface UserStats {
    joinedDate: Date
    reputation: number
    pricesSubmitted: number
    productsCreated: number
    topCategory: string
    level: number
    levelTitle: string
    nextLevelThreshold: number
}

const isLoading = ref(true)
const stats = ref<UserStats | null>(null)
const activityFeed = ref<any[]>([])
const user = ref({ email: '', id: '', role: '' })

onMounted(async () => {
    try {
        const { user: authUser } = await AuthService.getUser()
        if (authUser) {
            user.value.email = authUser.email || ''
            user.value.id = authUser.id
            user.value.role = authUser.role || 'Пользователь'
        }

        const rawStats = await AuthService.getUserStats()
        if (rawStats) {
            stats.value = rawStats
        }
        activityFeed.value = await AuthService.getUserActivity()
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="profile-view">
        <!-- Header -->
        <section class="profile-header">
            <div class="avatar-placeholder">
                {{ user.email.charAt(0).toUpperCase() }}
            </div>
            <div class="user-info">
                <h1>{{ user.email.split('@')[0] }}</h1>
                <p class="email">{{ user.email }}</p>
                <div class="badges">
                    <span class="badge" v-if="stats">⭐ {{ stats.reputation }} Репутация</span>
                    <span class="badge id-badge" title="User ID">🆔 {{ user.id.slice(0, 8) }}...</span>
                </div>
            </div>
        </section>

        <!-- Stats Grid -->
        <section class="stats-grid" v-if="stats">
            <!-- Level Card -->
            <FpCard class="stat-card level-card">
                <div class="level-info">
                    <span class="level-number">Lvl {{ stats.level }}</span>
                    <span class="level-title">{{ stats.levelTitle }}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar"
                        :style="{ width: Math.min((stats.reputation / stats.nextLevelThreshold) * 100, 100) + '%' }">
                    </div>
                </div>
                <span class="xp-text">{{ stats.reputation }} / {{ stats.nextLevelThreshold }} XP</span>
            </FpCard>

            <FpCard class="stat-card">
                <span class="stat-value">{{ stats.pricesSubmitted }}</span>
                <span class="stat-label">Цен добавлено</span>
            </FpCard>
            <FpCard class="stat-card">
                <span class="stat-value">{{ stats.productsCreated }}</span>
                <span class="stat-label">Товаров создано</span>
            </FpCard>
        </section>

        <!-- Activity Feed -->
        <section class="activity-section">
            <h2>Последняя активность</h2>
            <div class="activity-list">
                <div v-if="activityFeed.length === 0" class="empty-feed">
                    Нет активности
                </div>
                <FpCard v-for="act in activityFeed" :key="act.id" class="activity-item" padding="sm">
                    <div class="act-icon">{{ act.icon }}</div>
                    <div class="act-content">
                        <div class="act-header">
                            <span class="act-action">{{ act.action }}</span>
                            <span class="act-time">{{ act.time }}</span>
                        </div>
                        <span class="act-item">{{ act.item }}</span>
                        <span class="act-details">{{ act.details }}</span>
                    </div>
                </FpCard>
            </div>
        </section>
    </div>
</template>

<style scoped lang="scss">
.profile-view {
    /* max-width handled by MainLayout */
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    padding: 0 0.5rem; // Add horizontal padding for mobile
    max-width: var(--layout-max-width);
    margin: .5rem auto;
    width: 100%;
}

.profile-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    background: var(--color-surface);
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-1);
    position: relative;
    overflow: hidden;

    // Decorative geometric shape
    &::after {
        content: '';
        position: absolute;
        bottom: -20%;
        right: -5%;
        width: 300px;
        height: 300px;
        background: linear-gradient(45deg, rgba(108, 93, 211, 0.05), rgba(0, 210, 160, 0.05));
        border-radius: 50%;
        z-index: 0;
    }

    .avatar-placeholder {
        min-width: 4rem;
        min-height: 4rem;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-variant));
        color: white;
        border-radius: var(--radius-md); // Squircle
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        font-weight: 700;
        box-shadow: var(--shadow-2);
        z-index: 1;
    }

    .user-info {
        z-index: 1;

        h1 {
            margin: 0;
            font-size: var(--text-h3);
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .email {
            color: var(--color-text-secondary);
            margin: 4px 0 12px;
            font-size: var(--text-body-1);
        }
    }

    .badges {
        display: flex;
        gap: var(--spacing-sm);

        .badge {
            background: var(--color-background);
            padding: 6px 14px;
            border-radius: var(--radius-pill);
            font-size: var(--text-caption);
            font-weight: 600;
            border: 1px solid var(--color-border);
            display: flex;
            align-items: center;
            gap: 6px;
        }
    }
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }

    .stat-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-lg);
        gap: var(--spacing-xs);
        text-align: center;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        transition: all 0.2s;
        min-height: 120px;

        &:hover {
            border-color: var(--color-primary);
            box-shadow: var(--shadow-1);
            transform: translateY(-2px);
        }

        .stat-value {
            font-size: 32px; // Big number
            font-weight: 800;
            color: var(--color-primary);
            line-height: 1;
        }

        .stat-label {
            font-size: var(--text-caption);
            color: var(--color-text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
    }

    .level-card {
        grid-column: span 3;

        @media (max-width: 768px) {
            grid-column: span 1;
        }

        .level-info {
            display: flex;
            align-items: baseline;
            gap: 12px;
            margin-bottom: 8px;
        }

        .level-number {
            font-size: 24px;
            font-weight: 800;
            color: var(--color-primary);
        }

        .level-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--color-text-primary);
        }

        .progress-bar-container {
            width: 100%;
            height: 8px;
            background: var(--color-background);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 8px;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
            transition: width 0.5s ease-out;
        }

        .xp-text {
            font-size: 1rem;
            color: var(--color-text-secondary);
        }
    }
}

.activity-section {
    h2 {
        font-size: var(--text-h5);
        font-weight: 700;
        margin-bottom: var(--spacing-md);
    }
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.empty-feed {
    text-align: center;
    color: var(--color-text-secondary);
    padding: var(--spacing-lg);
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
}

.activity-item {
    display: flex;
    gap: var(--spacing-md);
    align-items: flex-start;
    border: 1px solid var(--color-border); // Visible border
    border-radius: var(--radius-md);
    background: var(--color-surface);
    transition: all 0.2s;

    &:hover {
        border-color: var(--color-primary);
        box-shadow: var(--shadow-1);
    }

    .act-icon {
        font-size: 24px;
        background: var(--color-background);
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
    }

    .act-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .act-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .act-action {
            font-weight: 700;
            font-size: var(--text-button);
            color: var(--color-primary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .act-time {
            font-size: var(--text-caption);
            color: var(--color-text-disabled);
        }
    }

    .act-item {
        font-weight: 600;
        font-size: var(--text-body-1);
        color: var(--color-text-primary);
    }

    .act-details {
        font-size: var(--text-body-2);
        color: var(--color-text-secondary);
    }
}
</style>
