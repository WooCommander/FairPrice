<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { authStore } from '@/modules/auth/store/authStore'

const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const navItems = [
	{ label: 'Главная', path: '/' },
	{ label: 'Поиск', path: '/search' },
	{ label: 'Профиль', path: '/profile' },
	{ label: 'Стенд', path: '/design-system' }
]

const currentPath = computed(() => route.path)

const navigate = (path: string) => {
	router.push(path)
}

const handleLogout = async () => {
	await authStore.logout()
	router.push('/login')
}
</script>

<template>
	<div class="main-layout">
		<header class="top-nav">
			<div class="nav-container">
				<div class="logo" @click="router.push('/')">
					Fair Price
				</div>

				<nav class="nav-links">
					<a v-for="item in navItems" :key="item.path" class="nav-link"
						:class="{ active: currentPath === item.path }" @click.prevent="navigate(item.path)">
						{{ item.label }}
					</a>
				</nav>

				<div class="actions">
					<button class="icon-btn theme-toggle" @click="toggleTheme">
						{{ isDark ? '🌞' : '🌙' }}
					</button>

					<div v-if="authStore.user.value" class="auth-controls">
						<span class="user-email">{{ authStore.user.value.email }}</span>
						<button class="icon-btn logout-btn" @click="handleLogout" title="Выйти">
							🚪
						</button>
					</div>
					<div v-else>
						<button class="login-btn" @click="router.push('/login')">
							Войти
						</button>
					</div>
				</div>
			</div>
		</header>

		<main class="page-content">
			<div class="content-container">
				<router-view v-slot="{ Component }">
					<transition name="fade" mode="out-in">
						<component :is="Component" />
					</transition>
				</router-view>
			</div>
		</main>
	</div>
</template>

<style scoped lang="scss">
.main-layout {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: var(--color-background);
}

.top-nav {
	background-color: var(--color-surface-translucent);
	backdrop-filter: blur(12px);
	border-bottom: 1px solid var(--color-border);
	position: sticky;
	top: 0;
	z-index: 100;
	padding: 0 var(--spacing-lg);

	.nav-container {
		max-width: 1400px;
		margin: 0 auto;
		height: 80px; // Taller header
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		font-size: 24px;
		font-weight: 700;
		color: var(--color-text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		letter-spacing: -0.5px;
	}

	.nav-links {
		display: flex;
		gap: 8px;
		background: var(--color-background);
		padding: 4px;
		border-radius: var(--radius-pill);
	}

	.nav-link {
		color: var(--color-text-secondary);
		font-weight: 600;
		cursor: pointer;
		padding: 10px 24px;
		border-radius: var(--radius-pill);
		transition: all 0.2s ease;
		font-size: 14px;

		&:hover {
			color: var(--color-text-primary);
		}

		&.active {
			background-color: var(--color-surface);
			color: var(--color-primary);
			box-shadow: var(--shadow-1);
		}
	}
}

.page-content {
	flex: 1;
	overflow-y: auto;
}

.content-container {
	max-width: 1400px;
	margin: 0 auto;
	padding: var(--spacing-lg);
}

.icon-btn {
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	cursor: pointer;
	font-size: 20px;
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: all 0.2s;
	color: var(--color-text-secondary);

	&:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
		transform: rotate(15deg);
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.auth-controls {
	display: flex;
	align-items: center;
	gap: 12px;
}

.user-email {
	font-size: var(--text-caption);
	color: var(--color-text-secondary);
	display: none;

	@media (min-width: 768px) {
		display: block;
	}
}

.login-btn {
	background: var(--color-primary);
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: var(--radius-pill);
	font-weight: 600;
	cursor: pointer;
	font-size: 14px;
	transition: 0.2s;

	&:hover {
		opacity: 0.9;
	}
}

.logout-btn {
	color: var(--color-error);
	border-color: rgba(var(--color-error-rgb), 0.2);

	&:hover {
		background: rgba(var(--color-error-rgb), 0.1);
		border-color: var(--color-error);
	}
}
</style>
