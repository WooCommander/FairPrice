<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <router-view />
</template>

<style lang="scss">
/* Global styles could go here or in main.scss */
</style>
