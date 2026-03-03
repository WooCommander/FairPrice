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
            const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
            router.push(redirectPath)
        } else {
            const errorMessage = authStore.error.value || 'Ошибка входа'
            if (errorMessage.toLowerCase().includes('email not confirmed')) {
                error.value = 'Email не подтвержден. Пожалуйста, проверьте свою почту.'
            } else if (errorMessage.toLowerCase().includes('invalid login credentials')) {
                error.value = 'Неверный email или пароль'
            } else {
                error.value = errorMessage
            }
        }
    } else {
        const result: any = await authStore.register(email.value, password.value)
        if (result.success) {
            if (result.message) {
                // Email confirmation needed
                successMessage.value = 'Регистрация успешна! Проверьте почту для подтверждения аккаунта.'
                isLogin.value = true
                password.value = '' // Clear password for security
            } else {
                const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
                router.push(redirectPath)
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
    background: radial-gradient(circle at 20% 20%, rgba(108, 93, 211, 0.08), transparent 32%),
        radial-gradient(circle at 80% 10%, rgba(0, 210, 160, 0.06), transparent 28%),
        var(--color-background);
}

.auth-card {
    width: 100%;
    max-width: 400px;
    padding: 28px 24px 32px;
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

/* Normalize browser autofill colors to match design system */
:deep(input:-webkit-autofill),
:deep(input:-webkit-autofill:hover),
:deep(input:-webkit-autofill:focus) {
    -webkit-text-fill-color: var(--color-text-primary);
    box-shadow: 0 0 0px 1000px var(--color-surface) inset;
    transition: background-color 9999s ease-in-out 0s;
}
</style>
