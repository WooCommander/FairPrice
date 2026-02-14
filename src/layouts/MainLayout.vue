<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { authStore } from '@/modules/auth/store/authStore'

const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const navItems = [
	{
		label: 'Главная',
		path: '/',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
	},
	{
		label: 'Поиск',
		path: '/search',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
	},
	{
		label: 'Профиль',
		path: '/profile',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
	},
	{
		label: 'Стенд',
		path: '/design-system',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.74 5.88-5.74 5.88-5.74-5.88z"></path><path d="M2 12l10 10 10-10"></path></svg>'
	}
]

const currentPath = computed(() => route.path)

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
					<button class="hamburger-btn" @click="isMenuOpen = true">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
							stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="3" y1="12" x2="21" y2="12"></line>
							<line x1="3" y1="6" x2="21" y2="6"></line>
							<line x1="3" y1="18" x2="21" y2="18"></line>
						</svg>
					</button>
					<div class="logo" @click="router.push('/')">
						Fair Price
					</div>
				</div>

				<div class="actions">
					<div v-if="!authStore.user.value">
						<button class="login-btn" @click="router.push('/login')">
							<span class="btn-text">Войти</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Backdrop -->
			<transition name="fade">
				<div v-if="isMenuOpen" class="menu-backdrop" @click="isMenuOpen = false"></div>
			</transition>

			<!-- Side Drawer -->
			<transition name="slide-right">
				<div v-if="isMenuOpen" class="menu-drawer">
					<div class="drawer-header">
						<div class="drawer-user" v-if="authStore.user.value">
							<div class="drawer-avatar">
								{{ authStore.user.value.email?.charAt(0).toUpperCase() }}
							</div>
							<div class="drawer-user-info">
								<span class="drawer-email">{{ authStore.user.value.email }}</span>
								<span class="drawer-status">Online</span>
							</div>
						</div>
						<div class="drawer-user guest" v-else>
							<div class="drawer-avatar guest-avatar">
								?
							</div>
							<div class="drawer-user-info">
								<span class="drawer-email">Гость</span>
								<button class="link-btn"
									@click="router.push('/login'); isMenuOpen = false">Войти</button>
							</div>
						</div>

						<button class="close-btn" @click="isMenuOpen = false">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>

					<div class="drawer-content">
						<div class="nav-group">
							<span class="nav-label">Меню</span>
							<a v-for="item in navItems" :key="item.path" class="drawer-link"
								:class="{ active: currentPath === item.path }"
								@click.prevent="navigate(item.path); isMenuOpen = false">
								<span class="link-icon" v-html="item.icon"></span>
								{{ item.label }}
							</a>
						</div>

						<div class="nav-group">
							<span class="nav-label">Инструменты</span>
							<a class="drawer-link" :class="{ active: currentPath === '/quick-calc' }"
								@click.prevent="navigate('/quick-calc'); isMenuOpen = false">
								<span class="link-icon">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
										stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
										<line x1="8" y1="6" x2="16" y2="6"></line>
										<line x1="16" y1="14" x2="16" y2="14"></line>
										<line x1="8" y1="14" x2="8" y2="14"></line>
										<line x1="12" y1="14" x2="12" y2="14"></line>
										<line x1="16" y1="18" x2="16" y2="18"></line>
										<line x1="8" y1="18" x2="8" y2="18"></line>
										<line x1="12" y1="18" x2="12" y2="18"></line>
									</svg>
								</span>
								Быстрый расчет
							</a>
						</div>
					</div>

					<div class="drawer-footer">
						<button class="theme-toggle-drawer" @click="toggleTheme">
							<span class="icon">{{ isDark ? '🌞' : '🌙' }}</span>
							<span>{{ isDark ? 'Светлая тема' : 'Темная тема' }}</span>
						</button>

						<button v-if="authStore.user.value" class="logout-drawer" @click="handleLogout">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
								<polyline points="16 17 21 12 16 7"></polyline>
								<line x1="21" y1="12" x2="9" y2="12"></line>
							</svg>
							Выйти
						</button>
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
	z-index: 1002;
	display: flex;
	align-items: center;
	justify-content: center;
}

.menu-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	backdrop-filter: blur(4px);
}

.menu-drawer {
	position: fixed;
	top: 0;
	left: 0;
	width: 85%;
	max-width: 320px;
	height: 100vh;
	background: var(--color-surface);
	z-index: 1001;
	display: flex;
	flex-direction: column;
	box-shadow: var(--shadow-3);
	border-right: 1px solid var(--color-border);
}

.drawer-header {
	padding: 24px 20px;
	border-bottom: 1px solid var(--color-border);
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
}

.drawer-user {
	display: flex;
	align-items: center;
	gap: 16px;
}

.drawer-avatar {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: var(--color-primary);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.25rem;
	font-weight: 700;
}

.guest-avatar {
	background: var(--color-text-tertiary);
}

.drawer-user-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.drawer-email {
	font-weight: 600;
	color: var(--color-text-primary);
	font-size: 0.95rem;
}

.drawer-status {
	font-size: 0.8rem;
	color: var(--color-success);
}

.link-btn {
	background: none;
	border: none;
	padding: 0;
	color: var(--color-primary);
	font-weight: 600;
	cursor: pointer;
	text-align: left;
}

.close-btn {
	background: none;
	border: none;
	color: var(--color-text-secondary);
	cursor: pointer;
	padding: 4px;

	&:hover {
		color: var(--color-text-primary);
	}
}

.drawer-content {
	flex: 1;
	overflow-y: auto;
	padding: 24px 0;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.nav-group {
	display: flex;
	flex-direction: column;
}

.nav-label {
	padding: 0 24px 8px;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: var(--color-text-tertiary);
	font-weight: 700;
}

.drawer-link {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px 24px;
	color: var(--color-text-secondary);
	text-decoration: none;
	font-weight: 500;
	transition: all 0.2s;
	border-left: 3px solid transparent;

	.link-icon {
		display: flex;
		align-items: center;
		color: var(--color-text-tertiary);
		transition: color 0.2s;
	}

	&:hover,
	&.active {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);

		.link-icon {
			color: var(--color-primary);
		}
	}

	&.active {
		border-left-color: var(--color-primary);
		background: rgba(var(--color-primary-rgb), 0.05);
	}
}

.drawer-footer {
	padding: 20px;
	border-top: 1px solid var(--color-border);
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.theme-toggle-drawer,
.logout-drawer {
	display: flex;
	align-items: center;
	gap: 12px;
	width: 100%;
	padding: 12px;
	background: none;
	border: none;
	border-radius: var(--radius-md);
	cursor: pointer;
	font-weight: 500;
	color: var(--color-text-secondary);
	transition: background 0.2s;

	&:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}
}

.logout-drawer:hover {
	color: var(--color-error);
	background: rgba(var(--color-error-rgb), 0.05);
}

// Right slide transition
.slide-right-enter-active,
.slide-right-leave-active {
	transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
	transform: translateX(-100%);
}

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
