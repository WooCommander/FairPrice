<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import { useAuth } from '@/modules/auth/composables/useAuth'

const { isDark, toggleTheme } = useTheme()
const { currentUser } = useAuth()
</script>

<template>
  <div class="home-page">
    <header class="header">
      <h2>Fair Price</h2>
      <div class="actions">
        <button @click="toggleTheme">
          {{ isDark ? '🌞' : '🌙' }}
        </button>
        <div v-if="currentUser">
          👤 {{ currentUser.email }}
        </div>
        <div v-else>
          <button>Login</button>
        </div>
      </div>
    </header>
    
    <main>
      <h3>Welcome to Fair Price!</h3>
      <p>Find the best prices around you.</p>
    </main>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
</style>
