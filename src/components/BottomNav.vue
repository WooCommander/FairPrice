<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Define nav items directly in script
const navItems = [
  { name: 'home', path: '/', icon: '🏠', label: 'Главная' },
  { name: 'search', path: '/search', icon: '🔍', label: 'Поиск' },
  { name: 'add', path: '/add-price', icon: '+', label: 'Добавить', isFab: true },
  { name: 'list', path: '/shopping-list', icon: '📝', label: 'Список' },
  { name: 'profile', path: '/profile', icon: '👤', label: 'Профиль' },
]

const navigate = (path: string) => {
  router.push(path)
}

const isActive = (path: string) => route.path === path
</script>

<template>
  <nav class="bottom-nav">
    <div v-for="item in navItems" :key="item.name" 
         class="nav-item" 
         :class="{ 'active': isActive(item.path), 'fab-container': item.isFab }"
         @click="navigate(item.path)">
      
      <div v-if="item.isFab" class="fab-button">
        <span class="fab-icon">{{ item.icon }}</span>
      </div>
      
      <template v-else>
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </template>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 64px;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding-top: 4px;
  position: relative;

  &.active {
    color: var(--color-primary);
  }

  &:not(.fab-container):active {
      transform: scale(0.95);
  }
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
}

// Floating Action Button Style
.fab-container {
  overflow: visible; // Allow button to protrude
  display: flex;
  justify-content: flex-end; // Push to bottom of container
  align-items: center;
}

.fab-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(108, 93, 211, 0.4); // Violet glow
  transform: translateY(-20px); // Float above bar
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); // Bouncy
  border: 4px solid var(--color-surface); // Cut-out effect

  &:active {
    transform: translateY(-18px) scale(0.95);
    box-shadow: 0 2px 8px rgba(108, 93, 211, 0.4);
  }
}

.fab-icon {
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
}
</style>
