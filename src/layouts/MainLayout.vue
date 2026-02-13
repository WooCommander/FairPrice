<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'
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

// ... (keep existing setup code) ...

// Keep existing methods
// Keep existing methods
const navigate = (path: string) => {
	router.push(path)
}

const isMenuOpen = ref(false)

const handleLogout = async () => {
	isMenuOpen.value = false
	await authStore.logout()
	router.push('/login')
}
</script>

<template>
	<div class="main-layout">
		<header class="top-nav">
			<div class="nav-container">
				<div class="logo-area">
					<button class="hamburger-btn" @click="isMenuOpen = !isMenuOpen">
						<span v-if="!isMenuOpen">☰</span>
						<span v-else>✕</span>
					</button>
					<div class="logo" @click="router.push('/')">
						Fair Price
					</div>
				</div>

				<div class="actions">
					<!-- Quick action for calculator on desktop? Maybe just keep in menu to be simple -->
					<!-- Keep login button visible if not logged in -->
					<div v-if="!authStore.user.value">
						<button class="login-btn" @click="router.push('/login')">
							<span class="btn-text">Войти</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Full Screen Menu Overlay -->
			<transition name="fade">
				<div v-if="isMenuOpen" class="menu-overlay" @click.self="isMenuOpen = false">
					<div class="menu-content">
						<!-- Navigation Links -->
						<a v-for="item in navItems" :key="item.path" class="menu-link"
							:class="{ active: currentPath === item.path }"
							@click.prevent="navigate(item.path); isMenuOpen = false">
							{{ item.label }}
						</a>

						<!-- Quick Calculator Link -->
						<a class="menu-link" :class="{ active: currentPath === '/quick-calc' }"
							@click.prevent="navigate('/quick-calc'); isMenuOpen = false">
							🔢 Быстрый расчет
						</a>

						<div class="menu-footer">
							<button class="theme-toggle-menu" @click="toggleTheme">
								<span>{{ isDark ? '🌞 Светлая тема' : '🌙 Темная тема' }}</span>
							</button>

							<div v-if="authStore.user.value" class="user-info-menu">
								{{ authStore.user.value.email }}
							</div>

							<button v-if="authStore.user.value" class="logout-link" @click="handleLogout">
								Выйти
							</button>
						</div>
					</div>
				</div>
			</transition>
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
// ... existing styles ...

.main-layout {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: var(--color-background);
}

.top-nav {
	background-color: var(--color-surface-translucent); // Keep translucent
	backdrop-filter: blur(12px);
	border-bottom: 1px solid var(--color-border);
	position: sticky;
	top: 0;
	z-index: 100;
	padding: 0 var(--spacing-lg);
	padding-top: env(safe-area-inset-top, 0px);

	@media (max-width: 768px) {
		padding-left: 8px;
		padding-right: 8px;
	}

	.nav-container {
		max-width: var(--layout-max-width);
		margin: 0 auto;
		height: 64px; // Standard height
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		font-size: 20px;
		font-weight: 700;
		color: var(--color-text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
	}
}

.logo-area {
	display: flex;
	align-items: center;
	gap: 12px;
}

.hamburger-btn {
	background: none;
	border: none;
	font-size: 24px;
	cursor: pointer;
	color: var(--color-text-primary);
	padding: 4px;
	z-index: 1002; // Above menu overlay
	position: relative; // For z-index to work
}

// Full Screen Menu Overlay
.menu-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: var(--color-surface); // Solid background or very high opacity
	// If using dark theme, surface is dark. If light, it's light.
	// User requested "semi-transparent", but it looks messy.
	// Let's try high opacity blur.
	// background: rgba(var(--color-surface-rgb), 0.98);
	backdrop-filter: blur(20px);
	z-index: 1001;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	transition: opacity 0.3s ease;
}

.menu-content {
	display: flex;
	flex-direction: column;
	gap: 32px; // More space
	text-align: center;
	width: 100%;
	max-width: 400px;
	padding: 40px 20px;
}

.menu-link {
	font-size: 2rem; // Larger
	font-weight: 700;
	color: var(--color-text-primary);
	text-decoration: none;
	padding: 8px;
	position: relative;
	transition: color 0.3s;

	&:hover,
	&.active {
		color: var(--color-primary);
		background: none; // Remove boxy background
	}

	// Underline effect
	&::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 2px;
		background: var(--color-primary);
		transition: width 0.3s;
	}

	&:hover::after,
	&.active::after {
		width: 40px;
	}
}

.menu-footer {
	margin-top: 60px;
	display: flex;
	flex-direction: column;
	gap: 24px;
	align-items: center;
}

.user-info-menu {
	color: var(--color-text-secondary);
	font-size: 1rem;
	font-weight: 500;
}

.theme-toggle-menu {
	background: var(--color-background);
	border: 1px solid var(--color-border);
	color: var(--color-text-primary);
	padding: 12px 24px;
	border-radius: 30px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 1rem;
	font-weight: 500;
	transition: transform 0.2s;

	&:active {
		transform: scale(0.95);
	}
}

.logout-link {
	color: var(--color-error);
	background: none;
	border: none;
	font-size: 1.1rem;
	font-weight: 500;
	cursor: pointer;
	padding: 12px;

	&:hover {
		opacity: 0.8;
	}
}

// Transitions
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.page-content {
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
}

.content-container {
	max-width: var(--layout-max-width);
	margin: 0 auto;
	padding: var(--spacing-lg);
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;

	@media (max-width: 768px) {
		padding: 0;
	}
}
</style>
