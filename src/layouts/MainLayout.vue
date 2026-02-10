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

const navigate = (path: string) => {
	router.push(path)
}

const isMenuOpen = ref(false)
const authControls = ref<HTMLElement | null>(null)

// Close menu when clicking outside
import { onMounted, onUnmounted } from 'vue'

const closeMenu = (e: MouseEvent) => {
	if (authControls.value && !authControls.value.contains(e.target as Node)) {
		isMenuOpen.value = false
	}
}

onMounted(() => {
	document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
	document.removeEventListener('click', closeMenu)
})

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

					<div v-if="authStore.user.value" class="auth-controls" ref="authControls">
						<button class="avatar-btn" @click="isMenuOpen = !isMenuOpen">
							{{ authStore.user.value.email?.charAt(0).toUpperCase() }}
						</button>

						<transition name="fade">
							<div v-if="isMenuOpen" class="user-menu">
								<div class="menu-header">
									<span class="user-email">{{ authStore.user.value.email }}</span>
								</div>
								<div class="menu-items">
									<button class="menu-item" @click="navigate('/profile'); isMenuOpen = false">
										👤 Профиль
									</button>
									<div class="divider"></div>
									<button class="menu-item logout" @click="handleLogout">
										🚪 Выйти
									</button>
								</div>
							</div>
						</transition>
					</div>
					<div v-else>
						<button class="login-btn" @click="router.push('/login')">
							<span class="btn-text">Войти</span>
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

.actions {
	display: flex;
	align-items: center;
	gap: 16px;
}

.auth-controls {
	display: flex;
	align-items: center;
	gap: 16px;
	position: relative;
}

.avatar-btn {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: var(--color-primary);
	color: white;
	border: none;
	cursor: pointer;
	font-weight: 700;
	font-size: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s;
	box-shadow: var(--shadow-1);

	&:hover {
		transform: scale(1.05);
	}
}

.user-menu {
	position: absolute;
	top: 120%;
	right: 0;
	width: 200px;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-md);
	box-shadow: var(--shadow-3);
	overflow: hidden;
	z-index: 1000;
	transform-origin: top right;
}

.menu-header {
	padding: 12px 16px;
	border-bottom: 1px solid var(--color-border);
	background: var(--color-background);
}

.user-email {
	font-size: 13px;
	color: var(--color-text-secondary);
	word-break: break-all;
	display: block; // Force block
}

.menu-items {
	padding: 4px 0;
}

.menu-item {
	width: 100%;
	text-align: left;
	padding: 10px 16px;
	background: none;
	border: none;
	color: var(--color-text-primary);
	cursor: pointer;
	font-size: 14px;
	transition: background 0.2s;
	display: flex;
	align-items: center;
	gap: 8px;

	&:hover {
		background: var(--color-surface-hover);
	}

	&.logout {
		color: var(--color-error);

		&:hover {
			background: rgba(var(--color-error-rgb), 0.1);
		}
	}
}

.divider {
	height: 1px;
	background: var(--color-border);
	margin: 4px 0;
}

.user-info {
	display: flex;
	align-items: center;
	gap: 8px;
}

.avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: var(--color-primary);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 12px;
}

.user-email-short {
	font-size: 13px;
	font-weight: 600;
	color: var(--color-text-primary);
	max-width: 100px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	display: none;

	@media (min-width: 768px) {
		display: block;
	}
}

.login-btn {
	background: var(--color-primary);
	color: white;
	border: none;
	padding: 10px 20px;
	border-radius: var(--radius-pill);
	font-weight: 600;
	cursor: pointer;
	font-size: 14px;
	transition: 0.2s;
	display: flex;
	align-items: center;
	gap: 6px;

	&:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
}

.logout-btn {
	width: 32px;
	height: 32px;
	font-size: 16px;
	color: var(--color-text-secondary);
	border-color: transparent;
	background: transparent;

	&:hover {
		background: rgba(var(--color-error-rgb), 0.1);
		color: var(--color-error);
	}
}
</style>
```
