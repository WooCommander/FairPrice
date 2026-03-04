<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { authStore } from '@/modules/auth/store/authStore'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { changelog } from '@/data/changelog'
import { setLocale, supportedLocales, i18n } from '@/i18n'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()
const { t } = useI18n()
const userRef = computed(() => authStore.user.value)
const appVersion = changelog[0]?.version || ''
const currentLocale = computed(() => i18n.global.locale.value as string)
const locales = supportedLocales.map(code => ({
	code,
	label: code.toUpperCase()
}))
const avatarUrl = computed(() => {
	const meta = userRef.value?.user_metadata as Record<string, any> | undefined
	return meta?.avatar_url || meta?.picture || null
})
const avatarLetter = computed(() => userRef.value?.email?.charAt(0).toUpperCase() || '?')
const profileTooltip = computed(() => userRef.value?.email || t('auth.guest'))

const handleProfileClick = async () => {
	if (userRef.value) {
		router.push('/profile')
		return
	}
	// try to rehydrate session before sending to login
	if (authStore.isLoading.value) return
	await authStore.init()
	if (userRef.value) {
		router.push('/profile')
	} else {
		router.push('/login')
	}
}

const navItems = computed(() => [
	{
		label: t('nav.home'),
		path: '/',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
	},
	{
		label: t('nav.search'),
		path: '/search',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
	},
	{
		label: t('nav.favorites'),
		path: '/favorites',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 21.78 9.27 16.94 14.14 18.18 21.02 12 17.77 5.82 21.02 7.06 14.14 2.22 9.27 8.91 8.26 12 2"></polygon></svg>'
	},
	{
		label: t('nav.profile'),
		path: '/profile',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
	},
	{
		label: t('nav.catalog'),
		path: '/catalog',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>'
	},
	{
		label: t('nav.stores'),
		path: '/stores',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
	},
	{
		label: t('nav.leaderboard'),
		path: '/leaderboard',
		icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'
	}
])

const currentPath = computed(() => route.path)

const navigate = (path: string) => {
	router.push(path)
}

const { currentCurrency } = catalogStore
const currencies: Array<'RUB' | 'USD' | 'EUR'> = ['RUB', 'USD', 'EUR']

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
					<button class="hamburger-btn" @click="isMenuOpen = true" v-if="!isMenuOpen">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
							stroke-linecap="round" stroke-linejoin="round">
							<line x1="3" y1="12" x2="21" y2="12"></line>
							<line x1="3" y1="6" x2="21" y2="6"></line>
							<line x1="3" y1="18" x2="21" y2="18"></line>
						</svg>
					</button>

					<div class="logo" @click="router.push('/')">
						Fair Price
						<span v-if="appVersion" class="version-pill">v{{ appVersion }}</span>
					</div>
				</div>

				<div class="actions">
									<div class="locale-selector">
					<button v-for="loc in locales" :key="loc.code" class="loc-btn"
						:class="{ active: currentLocale === loc.code }" @click="setLocale(loc.code as any)">
						{{ loc.label }}
					</button>
				</div>
					<!-- <button v-if="!user.value" class="login-btn" @click="router.push('/login')">
						<span class="btn-text">Войти</span>
					</button> -->
					<div class="profile-chip" :class="{ guest: !userRef }" :title="profileTooltip"
						@click="handleProfileClick">
						<img v-if="avatarUrl" :src="avatarUrl" alt="avatar" referrerpolicy="no-referrer" />
						<span v-else class="avatar-letter">{{ avatarLetter }}</span>
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

		<!-- Bottom Navigation (Mobile) -->
		<nav class="bottom-nav">
			<a class="nav-item" :class="{ active: route.path === '/' }" @click.prevent="router.push('/')">
				<span class="icon">🏠</span>
				<span class="label">{{ t('nav.home') }}</span>
			</a>
			<a class="nav-item" :class="{ active: route.path === '/catalog' }" @click.prevent="router.push('/catalog')">
				<span class="icon">📦</span>
				<span class="label">{{ t('nav.catalog') }}</span>
			</a>
			<div class="nav-item action" @click="router.push('/add-price')">
				<div class="plus-btn" :class="{ active: route.path === '/add-price' }">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
						stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
				</div>
				<span class="label">{{ t('nav.addPrice') }}</span>
			</div>
			<a class="nav-item" :class="{ active: route.path === '/shopping-list' }"
				@click.prevent="router.push('/shopping-list')">
				<span class="icon">🛒</span>
				<span class="label">{{ t('nav.shoppingList') }}</span>
			</a>
			<a class="nav-item" :class="{ active: route.path === '/favorites' }" @click.prevent="router.push('/favorites')">
				<span class="icon">⭐</span>
				<span class="label">{{ t('nav.favorites') }}</span>
			</a>
		</nav>

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
							<span class="drawer-email">{{ t('auth.guest') }}</span>
							<button class="link-btn" @click="router.push('/login'); isMenuOpen = false">{{ t('auth.login') }}</button>
						</div>
					</div>

					<button class="close-btn" @click="isMenuOpen = false">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
							stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>

				<div class="drawer-content">
					<div class="nav-group">
						<span class="nav-label">{{ t('nav.menu') }}</span>
						<a v-for="item in navItems" :key="item.path" class="drawer-link"
							:class="{ active: currentPath === item.path }" @click.prevent="navigate(item.path); isMenuOpen = false">
							<span class="link-icon" v-html="item.icon"></span>
							{{ item.label }}
						</a>
					</div>

					<div class="nav-group">
						<span class="nav-label">{{ t('nav.tools') }}</span>
						<a class="drawer-link" :class="{ active: currentPath === '/shopping-list' }"
							@click.prevent="navigate('/shopping-list'); isMenuOpen = false">
							<span class="link-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
									stroke-linecap="round" stroke-linejoin="round">
									<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
									<line x1="3" y1="6" x2="21" y2="6"></line>
									<path d="M16 10a4 4 0 0 1-8 0"></path>
								</svg>
							</span>
							{{ t('nav.shoppingList') }}
						</a>
						<a class="drawer-link" :class="{ active: currentPath === '/quick-calc' }"
							@click.prevent="navigate('/quick-calc'); isMenuOpen = false">
							<span class="link-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
									stroke-linecap="round" stroke-linejoin="round">
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
							{{ t('nav.quickCalc') }}
						</a>
					</div>

					<div class="nav-group">
						<span class="nav-label">{{ t('nav.dev') }}</span>
						<a class="drawer-link" :class="{ active: currentPath === '/design-system' }"
							@click.prevent="navigate('/design-system'); isMenuOpen = false">
							<span class="link-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
									stroke-linecap="round" stroke-linejoin="round">
									<path d="M12 2.69l5.74 5.88-5.74 5.88-5.74-5.88z"></path>
									<path d="M2 12l10 10 10-10"></path>
								</svg>
							</span>
							{{ t('nav.designSystem') }}
						</a>
						<a class="drawer-link" :class="{ active: currentPath === '/changelog' }"
							@click.prevent="navigate('/changelog'); isMenuOpen = false">
							<span class="link-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
									stroke-linecap="round" stroke-linejoin="round">
									<path d="M8 2h8a2 2 0 0 1 2 2v16l-6-3-6 3V4a2 2 0 0 1 2-2z"></path>
								</svg>
							</span>
							{{ t('nav.changelog') }}
						</a>
					</div>
				</div>

				<div class="drawer-footer">
					<button class="theme-toggle-drawer" @click="toggleTheme">
						<span class="icon">{{ isDark ? '🌞' : '🌙' }}</span>
						<span>{{ isDark ? t('theme.light') : t('theme.dark') }}</span>
					</button>

					<button v-if="authStore.user.value" class="logout-drawer" @click="handleLogout">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
							stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
							<polyline points="16 17 21 12 16 7"></polyline>
							<line x1="21" y1="12" x2="9" y2="12"></line>
						</svg>
						{{ t('auth.logout') }}
					</button>
				</div>
			</div>
		</transition>
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
	z-index: 1000; // Increased to be above page content sticky elements
	padding: 0 var(--spacing-lg);
	padding-top: env(safe-area-inset-top, 0px);

	@media (max-width: 768px) {
		padding-left: 8px;
		padding-right: 8px;
	}

	.nav-container {
		max-width: var(--layout-max-width);

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

	.version-pill {
		font-size: 11px;
		font-weight: 700;
		color: var(--color-text-tertiary);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		padding: 2px 8px;
		line-height: 1.2;
	}
}
}

.logo-area {
	display: flex;
	align-items: center;
	gap: 12px;
}

.actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.locale-selector {
	display: flex;
	background: var(--color-surface);
	padding: 3px;
	border-radius: 10px;
	border: 1px solid var(--color-border);
	gap: 4px;

	.loc-btn {
		background: none;
		border: none;
		padding: 4px 8px;
		font-size: 10px;
		font-weight: 700;
		color: var(--color-text-tertiary);
		border-radius: 7px;
		cursor: pointer;
		transition: all 0.2s;

		&.active {
			background: var(--color-primary);
			color: white;
		}
	}
}

.currency-selector {
	display: flex;
	background: var(--color-surface);
	padding: 3px;
	border-radius: 10px;
	border: 1px solid var(--color-border);
	gap: 2px;

	.curr-btn {
		background: none;
		border: none;
		padding: 3px 7px;
		font-size: 10px;
		font-weight: 700;
		color: var(--color-text-tertiary);
		border-radius: 7px;
		cursor: pointer;
		transition: all 0.2s;

		&.active {
			background: var(--color-primary);
			color: white;
		}
	}
}

.profile-chip {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: var(--color-primary);
	color: #fff;
	font-weight: 700;
	font-size: 15px;
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s;
	box-shadow: 0 6px 14px rgba(var(--color-primary-rgb), 0.24);

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 18px rgba(var(--color-primary-rgb), 0.28);
	}

	&:active {
		transform: scale(0.96);
	}

	&.guest {
		background: var(--color-text-tertiary);
		box-shadow: none;
	}
}

.hamburger-btn,
.back-btn {
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
	border-radius: var(--radius-sm);
	transition: background 0.2s;

	&:hover {
		background: var(--color-surface-hover);
	}
}

.menu-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(0, 0, 0, 0.5);
	z-index: 2000;
	backdrop-filter: blur(4px);
}

.menu-drawer {
	position: fixed;
	top: 0;
	left: 0;
	width: 85%;
	max-width: 320px;
	height: 100vh;
	height: 100dvh; // Dynamic viewport height for mobile browsers
	background: var(--color-surface);
	z-index: 2005;
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
	padding-bottom: calc(20px + env(safe-area-inset-bottom, 16px));
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
	max-width: 100%;

	padding: var(--spacing-lg);
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 100%;

	@media (max-width: 768px) {
		padding: 0;
		padding-bottom: 72px; // Space for bottom nav
	}
}

.bottom-nav {
	display: none;

	@media (max-width: 768px) {
		display: flex;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 64px;
		height: calc(64px + env(safe-area-inset-bottom, 0px));
		background: var(--color-surface-translucent);
		backdrop-filter: blur(12px);
		border-top: 1px solid var(--color-border);
		z-index: 1000;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		justify-content: space-around;
		align-items: center;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--color-text-tertiary);
		text-decoration: none;
		flex: 1;
		gap: 4px;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;

		.icon {
			font-size: 20px;
		}

		.label {
			font-size: 10px;
			font-weight: 500;
			letter-spacing: 0.02em;
		}

		&.active {
			color: #fff;

			&::before {
				content: '';
				position: absolute;
				width: 44px;
				height: 44px;
				top: -6px;
				left: 50%;
				transform: translateX(-50%);
				background: linear-gradient(150deg, var(--color-primary), var(--color-primary-variant));
				border-radius: 18px;
				z-index: -1;
				box-shadow: 0 10px 22px rgba(var(--color-primary-rgb), 0.35);
				pointer-events: none;
			}

			.icon {
				transform: translateY(-2px);
				filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
			}

			.label {
				font-weight: 800;
				letter-spacing: 0.05em;
				color: #fff;
			}
		}

		&.action {
			position: relative;
			top: -12px;

			.plus-btn {
				width: 48px;
				height: 48px;
				background: var(--color-primary);
				color: white;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
				margin-bottom: 2px;
				transition: all 0.2s;

				&.active {
					box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.2);
				}
			}

			&:active .plus-btn {
				transform: scale(0.9);
			}
		}
	}
}
</style>

