<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../store/authStore'
import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'

const router = useRouter()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const error = ref('')
const successMessage = ref('')

const toggleMode = () => {
    isLogin.value = !isLogin.value
    error.value = ''
    successMessage.value = ''
}

const handleSubmit = async () => {
    error.value = ''
    successMessage.value = ''

    // Basic validation
    if (!email.value || !password.value) {
        error.value = 'Заполните все поля'
        return
    }

    if (password.value.length < 6) {
        error.value = 'Пароль должен быть не менее 6 символов'
        return
    }

    if (isLogin.value) {
        const success = await authStore.login(email.value, password.value)
        if (success) {
            router.push('/')
        } else {
            error.value = authStore.error.value || 'Ошибка входа'
        }
    } else {
        const result: any = await authStore.register(email.value, password.value)
        if (result.success) {
            if (result.message) {
                // Email confirmation needed
                successMessage.value = 'Регистрация успешна! Проверьте почту для подтверждения.'
                isLogin.value = true // Switch to login view or just show message
            } else {
                // Auto logged in
                router.push('/')
            }
        } else {
            error.value = result.error || 'Ошибка регистрации'
        }
    }
}
</script>

<template>
    <div class="auth-view">
        <FpCard class="auth-card">
            <h1 class="title">{{ isLogin ? 'Вход' : 'Регистрация' }}</h1>

            <div class="form">
                <div class="error-alert" v-if="error">{{ error }}</div>
                <div class="success-alert" v-if="successMessage">{{ successMessage }}</div>

                <FpInput v-model="email" label="Email" type="email" placeholder="name@example.com" />

                <FpInput v-model="password" label="Пароль" type="password" placeholder="••••••"
                    @keyup.enter="handleSubmit" />

                <div class="actions">
                    <FpButton :loading="authStore.isLoading.value" size="full" @click="handleSubmit">
                        {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
                    </FpButton>
                </div>

                <div class="toggle-mode">
                    <span v-if="isLogin">
                        Нет аккаунта? <a href="#" @click.prevent="toggleMode">Создать</a>
                    </span>
                    <span v-else>
                        Есть аккаунт? <a href="#" @click.prevent="toggleMode">Войти</a>
                    </span>
                </div>
            </div>
        </FpCard>
    </div>
</template>

<style scoped lang="scss">
.auth-view {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    /* Centered vertically in layout */
    padding: var(--spacing-md);
}

.auth-card {
    width: 100%;
    max-width: 400px;
}

.title {
    text-align: center;
    margin-bottom: var(--spacing-lg);
    font-size: var(--text-h3);
}

.form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.actions {
    margin-top: var(--spacing-sm);
}

.toggle-mode {
    text-align: center;
    font-size: var(--text-body-2);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-md);

    a {
        color: var(--color-primary);
        font-weight: 600;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

.error-alert {
    background: #fee2e2;
    color: #991b1b;
    padding: 12px;
    border-radius: var(--radius-sm);
    font-size: var(--text-caption);
    text-align: center;
}

.success-alert {
    background: #dcfce7;
    color: #166534;
    padding: 12px;
    border-radius: var(--radius-sm);
    font-size: var(--text-caption);
    text-align: center;
}
</style>
