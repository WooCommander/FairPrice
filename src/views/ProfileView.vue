<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AuthService } from '@/modules/auth/services/AuthService'
import FpCard from '@/design-system/components/FpCard.vue'

interface UserStats {
    joinedDate: Date
    reputation: number
    pricesSubmitted: number
    moneySaved: number
    topCategory: string
}

const isLoading = ref(true)
const stats = ref<UserStats | null>(null)
const user = ref({ email: 'user@example.com', name: 'Demo User', id: '', role: '' }) // Mock user

onMounted(async () => {
    try {
        // In real app, we get user from session
        const { user: authUser } = await AuthService.getUser()
        if (authUser) {
            user.value.email = authUser.email || ''
            user.value.id = authUser.id
            user.value.role = authUser.role || 'User'
        }

        stats.value = await AuthService.getUserStats()
    } finally {
        isLoading.value = false
    }
})

const activityFeed = [
    { id: 1, action: 'Added Price', item: 'Banana (1kg)', details: '18,500 UZS at Korzinka', time: '2 hours ago', icon: '🍌' },
    { id: 2, action: 'Verified', item: 'Milk (1L)', details: 'Confirmed price at Makro', time: '1 day ago', icon: '🥛' },
    { id: 3, action: 'Commented', item: 'Sugar', details: '"Price seems too high"', time: '3 days ago', icon: '💬' },
]
</script>

<template>
    <div class="profile-view">
        <!-- Header -->
        <section class="profile-header">
            <div class="avatar-placeholder">
                {{ user.name.charAt(0) }}
            </div>
            <div class="user-info">
                <h1>{{ user.name }}</h1>
                <p class="email">{{ user.email }}</p>
                <div class="badges">
                    <span class="badge" v-if="stats">⭐ {{ stats.reputation }} Rep</span>
                    <span class="badge" v-if="user.role">🛡️ {{ user.role }}</span>
                    <span class="badge id-badge" title="User ID">🆔 {{ user.id.slice(0, 8) }}...</span>
                </div>
            </div>
        </section>

        <!-- Stats Grid -->
        <section class="stats-grid" v-if="stats">
            <FpCard class="stat-card">
                <span class="stat-value">{{ stats.pricesSubmitted }}</span>
                <span class="stat-label">Prices Added</span>
            </FpCard>
            <FpCard class="stat-card">
                <span class="stat-value">{{ (stats.moneySaved / 1000).toFixed(0) }}k</span>
                <span class="stat-label">UZS Saved (Est)</span>
            </FpCard>
            <FpCard class="stat-card">
                <span class="stat-value">🏆</span>
                <span class="stat-label">Top: {{ stats.topCategory }}</span>
            </FpCard>
        </section>

        <!-- Activity Feed -->
        <section class="activity-section">
            <h2>Recent Activity</h2>
            <div class="activity-list">
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
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
}

.profile-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    background: var(--color-surface);
    padding: var(--spacing-xl); // Larger padding
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
        width: 100px;
        height: 100px;
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
