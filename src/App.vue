<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import MainLayout from '@/layouts/MainLayout.vue'
import FpNotificationContainer from '@/design-system/components/FpNotificationContainer.vue'
import { updateStore } from '@/modules/updates/updateStore'
import { DeviceService } from '@/app/services/DeviceService'
import { appService } from '@/app/services/app-service'
import { reminderStore } from '@/modules/reminders/state/reminderStore'

const { initTheme } = useTheme()
const router = useRouter()

const update = updateStore.available
const bannerVisible = updateStore.bannerVisible

onMounted(async () => {
  initTheme()
  DeviceService.initStatusBar()
  DeviceService.initBackButton(router)
  appService.initBirthdayReminders() // Проверка ДР
  reminderStore.init() // напоминания: realtime-обработка в открытом приложении
  updateStore.check()
})
</script>

<template>
  <MainLayout />
  <FpNotificationContainer />

  <!-- Update banner -->
  <Transition name="slide-up">
    <div v-if="bannerVisible && update" class="update-banner">
      <div class="update-text">
        <span class="update-title">Доступно обновление {{ update.version }}</span>
        <span v-if="update.notes" class="update-notes">{{ update.notes }}</span>
      </div>
      <div class="update-actions">
        <button class="btn-dismiss" @click="updateStore.dismiss()">Свернуть</button>
        <button class="btn-install" @click="updateStore.install()">Обновить</button>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss">
// Global resets if needed
</style>

<style scoped lang="scss">
.update-banner {
  position: fixed;
  bottom: 72px; // above bottom nav
  left: 12px;
  right: 12px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-primary);
  border-radius: 16px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-2);
  z-index: 9000;
}

.update-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.update-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.update-notes {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.update-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-dismiss {
  padding: 7px 12px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.btn-install {
  padding: 7px 14px;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
