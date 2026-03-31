<script setup lang="ts">
import { computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import type { Birthday } from '../../domain/Birthday'
import { getZodiac, getChineseZodiac, getDaysUntilNext, getTurningAge, getNextRoundDays } from '../../lib/birthdayUtils'

const props = defineProps<{
    birthday: Birthday
}>()

const emit = defineEmits<{
    (e: 'delete', id: string): void
}>()

const daysLeft = computed(() => getDaysUntilNext(props.birthday.day, props.birthday.month))
const turningAge = computed(() => getTurningAge(props.birthday.year, props.birthday.day, props.birthday.month))
const zodiac = computed(() => getZodiac(props.birthday.day, props.birthday.month))
const chineseZodiac = computed(() => getChineseZodiac(props.birthday.year))
const roundDaysInfo = computed(() => getNextRoundDays(props.birthday.year, props.birthday.day, props.birthday.month))

const formattedDate = computed(() => {
    const d = String(props.birthday.day).padStart(2, '0')
    const m = String(props.birthday.month).padStart(2, '0')
    const y = props.birthday.year ? String(props.birthday.year) : ''
    return y ? `${d}.${m}.${y}` : `${d}.${m}`
})

const isToday = computed(() => daysLeft.value === 0)
const isSoon = computed(() => daysLeft.value > 0 && daysLeft.value <= 7)

const daysLeftText = computed(() => {
    if (isToday.value) return '🎉 Сегодня!'
    if (daysLeft.value === 1) return 'Завтра'
    
    const lastDigit = daysLeft.value % 10
    const lastTwoDigits = daysLeft.value % 100
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `Через ${daysLeft.value} дней`
    if (lastDigit === 1) return `Через ${daysLeft.value} день`
    if (lastDigit >= 2 && lastDigit <= 4) return `Через ${daysLeft.value} дня`
    return `Через ${daysLeft.value} дней`
})

const ageText = computed(() => {
    if (turningAge.value === null) return ''
    const age = turningAge.value
    
    const lastDigit = age % 10
    const lastTwoDigits = age % 100
    
    let word = 'лет'
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) word = 'лет'
    else if (lastDigit === 1) word = 'год'
    else if (lastDigit >= 2 && lastDigit <= 4) word = 'года'
    
    if (isToday.value) {
        return `Исполнилось ${age} ${word}`
    } else {
        return `Исполнится ${age} ${word}`
    }
})

// Цвет карточки в зависимости от близости ДР
const cardStyle = computed(() => {
    if (isToday.value) {
        return {
            background: 'linear-gradient(135deg, rgba(254, 215, 170, 0.4) 0%, rgba(253, 164, 175, 0.4) 100%)',
            borderColor: 'var(--color-primary)'
        }
    }
    if (isSoon.value) {
        return {
            background: 'linear-gradient(135deg, rgba(167, 243, 208, 0.3) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.5)'
        }
    }
    return {}
})
</script>

<template>
    <div class="birthday-card" :style="cardStyle">
        <div class="card-header">
            <div class="main-info">
                <h3 class="name">{{ birthday.name }}</h3>
                <span class="date">{{ formattedDate }}</span>
            </div>
            
            <div class="days-badge" :class="{ 'is-today': isToday, 'is-soon': isSoon }">
                {{ daysLeftText }}
            </div>
        </div>

        <div class="card-body">
            <div class="tags-container" v-if="turningAge || zodiac || chineseZodiac">
                <span v-if="turningAge" class="tag age-tag">
                    📈 {{ ageText }}
                </span>
                <span class="tag zodiac-tag">
                    {{ zodiac }}
                </span>
                <span v-if="chineseZodiac" class="tag horo-tag">
                    {{ chineseZodiac }}
                </span>
            </div>

            <!-- Раздел круглых дат -->
            <div v-if="roundDaysInfo && !isToday && daysLeft > 7" class="round-days-info">
                <div class="round-header">Скоро круглая дата:</div>
                <div class="round-text">
                    ⭐ <b>{{ roundDaysInfo.nextMilestone }} дней</b> наступит {{ roundDaysInfo.milestoneDate }}
                </div>
            </div>
        </div>
        
        <button class="delete-btn" @click="$emit('delete', birthday.id)" aria-label="Удалить">
            <Trash2 :size="16" />
        </button>
    </div>
</template>

<style scoped lang="scss">
.birthday-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: hidden;

    &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
        
        .delete-btn {
            opacity: 1;
        }
    }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.main-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.name {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--color-text-primary);
    word-break: break-word;
}

.date {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    font-weight: 600;
}

.days-badge {
    font-size: 0.75rem;
    font-weight: 800;
    padding: 6px 12px;
    border-radius: 20px;
    background: var(--color-background);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    text-align: center;
    border: 1px solid var(--color-border);

    &.is-today {
        background: var(--color-primary);
        color: var(--color-on-primary);
        border-color: var(--color-primary);
        animation: pulseHeart 2s infinite;
    }

    &.is-soon {
        background: color-mix(in srgb, var(--color-primary) 15%, transparent);
        color: var(--color-primary);
        border-color: transparent;
    }
}

.card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tag {
    font-size: 0.75rem;
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--color-background);
    color: var(--color-text-secondary);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    border: 1px solid var(--color-border);
}

.round-days-info {
    margin-top: 4px;
    padding: 10px 12px;
    background: color-mix(in srgb, var(--color-surface) 50%, rgba(255, 255, 255, 0.5));
    border-radius: 10px;
    border: 1px dashed var(--color-border);
    
    .round-header {
        font-size: 0.7rem;
        color: var(--color-text-tertiary);
        text-transform: uppercase;
        margin-bottom: 4px;
        letter-spacing: 0.5px;
        font-weight: 700;
    }
    .round-text {
        font-size: 0.85rem;
        color: var(--color-text-secondary);
        line-height: 1.4;
    }
}

.delete-btn {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-tertiary);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0.6; // visible on mobile
    transition: all 0.2s;

    @media (hover: hover) {
        opacity: 0;
    }

    &:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.3);
    }
}

@keyframes pulseHeart {
    0% { transform: scale(1); }
    10% { transform: scale(1.05); }
    20% { transform: scale(1); }
    100% { transform: scale(1); }
}
</style>
