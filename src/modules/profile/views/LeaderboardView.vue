<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { LeaderboardService, type LeaderboardCategory, type LeaderboardEntry } from '../services/LeaderboardService'
import FpCard from '@/design-system/components/FpCard.vue'
import { FpSpinner } from '@/design-system'

const categories: { key: LeaderboardCategory; label: string; unit: string; icon: string }[] = [
    { key: 'reputation', label: 'Репутация', unit: 'очков', icon: '🏆' },
    { key: 'products', label: 'Товары', unit: 'товаров', icon: '📦' },
    { key: 'prices', label: 'Цены', unit: 'цен', icon: '💰' },
]

const activeCategory = ref<LeaderboardCategory>('reputation')
const entries = ref<LeaderboardEntry[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

async function load() {
    isLoading.value = true
    error.value = null
    try {
        entries.value = await LeaderboardService.getLeaderboard(activeCategory.value)
    } catch (e: any) {
        error.value = 'Не удалось загрузить рейтинг'
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

watch(activeCategory, load)
onMounted(load)
</script>

<template>
    <div class="leaderboard-view">
        <div class="page-title-row">
            <h1 class="page-title">Рейтинг</h1>
        </div>

        <!-- Category Tabs -->
        <div class="category-tabs">
            <button
                v-for="cat in categories"
                :key="cat.key"
                class="tab-btn"
                :class="{ active: activeCategory === cat.key }"
                @click="activeCategory = cat.key"
            >
                <span class="tab-icon">{{ cat.icon }}</span>
                {{ cat.label }}
            </button>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="loading-state">
            <FpSpinner />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="empty-state">{{ error }}</div>

        <!-- Empty -->
        <div v-else-if="entries.length === 0" class="empty-state">
            Пока нет данных
        </div>

        <!-- List -->
        <div v-else class="entries-list">
            <FpCard
                v-for="entry in entries"
                :key="entry.userId"
                class="entry-card"
                :class="{ 'is-me': entry.isCurrentUser, 'is-podium': entry.rank <= 3 }"
            >
                <div class="entry-rank">
                    <span v-if="entry.rank <= 3" class="medal">{{ MEDAL[entry.rank] }}</span>
                    <span v-else class="rank-num">#{{ entry.rank }}</span>
                </div>
                <div class="entry-info">
                    <span class="entry-name" :class="{ 'me-label': entry.isCurrentUser }">
                        {{ entry.displayName }}
                    </span>
                </div>
                <div class="entry-score">
                    <span class="score-value">{{ entry.score.toLocaleString('ru-RU') }}</span>
                    <span class="score-unit">{{ categories.find(c => c.key === activeCategory)?.unit }}</span>
                </div>
            </FpCard>
        </div>
    </div>
</template>

<style scoped lang="scss">
.leaderboard-view {
    padding: 0 0.5rem;
}

.category-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: var(--spacing-md);
    overflow-x: auto;
    padding-bottom: 2px;
}

.tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1.5px solid var(--color-border);
    border-radius: 20px;
    background: var(--color-surface);
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;

    &.active {
        border-color: var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.08);
        color: var(--color-primary);
    }

    .tab-icon {
        font-size: 16px;
    }
}

.loading-state,
.empty-state {
    display: flex;
    justify-content: center;
    padding: 40px;
    color: var(--color-text-secondary);
}

.entries-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.entry-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    transition: border-color 0.2s;

    &.is-me {
        border: 1.5px solid var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.04);
    }

    &.is-podium:not(.is-me) {
        background: var(--color-surface);
    }
}

.entry-rank {
    width: 36px;
    text-align: center;
    flex-shrink: 0;

    .medal {
        font-size: 24px;
    }

    .rank-num {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-secondary);
    }
}

.entry-info {
    flex: 1;
    min-width: 0;
}

.entry-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-primary);

    &.me-label {
        color: var(--color-primary);
        font-weight: 700;
    }
}

.entry-score {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;

    .score-value {
        font-size: 16px;
        font-weight: 700;
        color: var(--color-text-primary);
    }

    .score-unit {
        font-size: 11px;
        color: var(--color-text-secondary);
    }
}
</style>
