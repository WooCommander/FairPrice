<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Gift, Share2, Users } from 'lucide-vue-next'
import { useBirthdaysStore } from '../state/useBirthdaysStore'
import { FpHaptics } from '@/shared/lib/haptics'
import { FpIconButton } from '@/design-system'
import AddBirthdayInput from './components/AddBirthdayInput.vue'
import BirthdayCard from './components/BirthdayCard.vue'
import BirthdayShareModal from './components/BirthdayShareModal.vue'
import type { BirthdayInsertDTO } from '../domain/Birthday'

const router = useRouter()
const { birthdays, sortedBirthdays, sharedGroups, isLoading, fetchBirthdays, addBirthday, editBirthday, removeBirthday } = useBirthdaysStore()

const showShare = ref(false)

onMounted(() => {
    fetchBirthdays()
})

const handleAdd = async (payload: BirthdayInsertDTO) => {
    try {
        await addBirthday(payload)
    } catch (e) {
        console.error(e)
    }
}

const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm('Удалить этот день рождения?')
    if (isConfirmed) {
        FpHaptics.warning()
        try {
            await removeBirthday(id)
            FpHaptics.success()
        } catch (e) {
            console.error(e)
        }
    }
}

const handleEdit = async (id: string, updates: any) => {
    try {
        await editBirthday(id, updates)
        FpHaptics.success()
    } catch (e) {
        console.error(e)
    }
}
</script>

<template>
    <div class="birthdays-view">
        <header class="hub-header">
            <FpIconButton variant="surface" round label="Назад" @click="router.back()">
                <ArrowLeft :size="22" />
            </FpIconButton>
            <h1 class="title">Дни Рождения</h1>
            <FpIconButton variant="surface" round label="Поделиться списком" @click="showShare = true">
                <Share2 :size="18" />
            </FpIconButton>
        </header>

        <p class="subtitle">Ваш личный календарь праздников. Можно поделиться списком целиком или выборочно.</p>

        <!-- Ввод -->
        <AddBirthdayInput @add="handleAdd" />

        <!-- Заглушка загрузки -->
        <div v-if="isLoading && sortedBirthdays.length === 0" class="state-container">
            <div class="loader"></div>
            <p>Загрузка календаря...</p>
        </div>

        <!-- Разделитель: скоро -->
        <div v-else-if="sortedBirthdays.length > 0" class="birthdays-list">
            <TransitionGroup name="list">
                <BirthdayCard 
                    v-for="bday in sortedBirthdays" 
                    :key="bday.id" 
                    :birthday="bday"
                    @delete="handleDelete"
                    @edit="handleEdit"
                />
            </TransitionGroup>
        </div>

        <!-- Пустое состояние -->
        <div v-else class="state-container empty-state">
            <div class="empty-icon-wrapper">
                <Gift :size="48" class="text-secondary" />
            </div>
            <h3>Нет предстоящих праздников</h3>
            <p>Добавьте дни рождения близких, чтобы всегда помнить о них!</p>
        </div>

        <!-- Поделились со мной -->
        <section v-for="group in sharedGroups" :key="group.ownerEmail" class="shared-section">
            <h2 class="shared-label"><Users :size="16" /> От {{ group.ownerEmail }}</h2>
            <div class="birthdays-list">
                <BirthdayCard v-for="bday in group.items" :key="bday.id" :birthday="bday" readonly />
            </div>
        </section>

        <BirthdayShareModal :visible="showShare" :birthdays="birthdays" @close="showShare = false" />
    </div>
</template>

<style scoped lang="scss">
.birthdays-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--spacing-md);
    position: relative;
    overflow-y: auto;
    padding-bottom: 40px;
}

.hub-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);

    .title {
        font-size: 1.5rem;
        font-weight: 800;
        margin: 0;
        color: var(--color-text-primary);
        flex: 1;
    }
}

.shared-section {
    margin-top: var(--spacing-xl);
}

.shared-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-tertiary);
    font-weight: 700;
    margin: 0 0 12px;
    word-break: break-all;
}

.subtitle {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-lg);
    font-size: 0.95rem;
    line-height: 1.4;
}

.icon-btn {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s;

    &:hover { background: var(--color-surface-hover); }
}

.birthdays-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--color-text-secondary);
    gap: var(--spacing-md);
    padding-top: 40px;
    
    &.empty-state {
        text-align: center;
        
        h3 {
            margin: 0;
            color: var(--color-text-primary);
        }
        p {
            margin: 0;
            max-width: 250px;
            font-size: 0.95rem;
            line-height: 1.4;
        }
    }
}

.empty-icon-wrapper {
    width: 80px;
    height: 80px;
    background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-sm);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    color: var(--color-primary);
}

.loader {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    100% { transform: rotate(360deg); }
}

/* Animations for list */
.list-enter-active,
.list-leave-active,
.list-move {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.list-enter-from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
}

.list-leave-to {
    opacity: 0;
    transform: translateX(30px);
}

.list-leave-active {
    position: absolute;
    width: calc(100% - var(--spacing-md) * 2);
}
</style>
