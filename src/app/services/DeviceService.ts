import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import type { Router } from 'vue-router';

export class DeviceService {
  /**
   * Инициализирует перехват аппаратной кнопки "Назад" и системного свайпа на Android
   */
  static initBackButton(router: Router) {
    if (!Capacitor.isNativePlatform()) return;

    CapacitorApp.addListener('backButton', () => {
      const exitRoutes = ['Home', 'Catalog', 'ShoppingList', 'QuickCalc', 'Login'];
      const currentRouteName = router.currentRoute.value.name as string;

      if (exitRoutes.includes(currentRouteName)) {
        CapacitorApp.exitApp();
      } else {
        router.back();
      }
    });
  }

  /**
   * Инициализирует и настраивает Status Bar под текущую тему приложения.
   */
  static async initStatusBar() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Изначально берется системная тема для приложения:
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      await this.updateStatusBarStyle(prefersDark);

      // Подписываемся на системные изменения темы
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
        await this.updateStatusBarStyle(e.matches);
      });
    } catch (e) {
      console.warn('StatusBar manipulation failed', e);
    }
  }

  /**
   * Обновляет стиль и цвет статусбара.
   */
  static async updateStatusBarStyle(isDark: boolean) {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Style.Dark означает темный фон и светлый текст (Подходит для тёмной темы)
      // Style.Light означает светлый фон и темный текст (Подходит для светлой темы)
      await StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light
      });

      // Мы берем цвет --color-background из нашего приложения
      // Чтобы получить HEX, нам придется вычислить его или захардкодить.
      // Безопаснее использовать известные цвета темы
      const bgColor = isDark ? '#111425' : '#F0F3F8';

      // На Android можно динамически менять цвет Status Bar
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: bgColor });
      }
    } catch (error) {
      console.warn('Failed to update status bar style:', error);
    }
  }
}
