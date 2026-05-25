export interface Preferences {
  lastUsedStoreName: string | null;
}

const STORAGE_KEY = 'fp_user_preferences';

class UserPreferencesService {
  private prefs: Preferences = {
    lastUsedStoreName: null,
  };

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.prefs = { ...this.prefs, ...JSON.parse(stored) };
      } else {
        // Миграция старых ключей (если они были)
        const oldStoreName = localStorage.getItem('lastUsedStoreName');
        if (oldStoreName) {
          this.prefs.lastUsedStoreName = oldStoreName;
          this.save();
          // Оставляем старый ключ пока не убедимся, что миграция прошла успешно
        }
      }
    } catch (e) {
      console.error('Failed to load user preferences', e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs));
    } catch (e) {
      console.error('Failed to save user preferences', e);
    }
  }

  get lastUsedStoreName(): string | null {
    return this.prefs.lastUsedStoreName;
  }

  set lastUsedStoreName(val: string | null) {
    this.prefs.lastUsedStoreName = val;
    this.save();
  }
}

export const UserPreferences = new UserPreferencesService();
