<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '@/modules/auth/services/AuthService'
import FpCard from '@/design-system/components/FpCard.vue'
import FpNumberInput from '@/design-system/components/FpNumberInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { CurrencyService } from '@/modules/catalog/services/CurrencyService'
import { CatalogService } from '@/modules/catalog/services/CatalogService'
import { useNotify } from '@/composables/useNotify'

type CurrencyCode = 'RUB' | 'USD' | 'EUR'

const currencies: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'RUB', symbol: '₽', label: 'Рубль' },
  { code: 'USD', symbol: '$', label: 'Доллар' },
  { code: 'EUR', symbol: '€', label: 'Евро' },
]

const { currentCurrency } = catalogStore
const formatPrice = computed(() => (price: number) => {
  const currency = currentCurrency.value
  return CurrencyService.format(CurrencyService.convert(price, 'RUB', currency), currency)
})
const currencySaved = ref(false)
const ratesSaved = ref(false)

const changeCurrency = (code: CurrencyCode) => {
  catalogStore.setCurrency(code)
  currencySaved.value = true
  setTimeout(() => { currencySaved.value = false }, 2000)
}

// Exchange rates
const savedRates = CurrencyService.getRates()
const usdRate = ref(savedRates.USD)
const eurRate = ref(savedRates.EUR)

const saveRates = async () => {
  const usd = Number(usdRate.value)
  const eur = Number(eurRate.value)
  if (usd <= 0 || eur <= 0) return
  CurrencyService.setRates(usd, eur)
  await AuthService.setExchangeRates(usd, eur)
  ratesSaved.value = true
  setTimeout(() => { ratesSaved.value = false }, 2000)
}

const router = useRouter()

interface UserStats {
  joinedDate: Date
  reputation: number
  pricesSubmitted: number
  productsCreated: number
  topCategory: string
  level: number
  levelTitle: string
  nextLevelThreshold: number
}

const isLoading = ref(true)
const stats = ref<UserStats | null>(null)
const activityFeed = ref<any[]>([])
const user = ref({ email: '', id: '', role: '' })
const pendingProducts = ref<Array<{ id: string, name: string, category: string, created_at: string, created_by: string }>>([])
const pendingError = ref('')
const { notify } = useNotify()

// Display name
const displayName = ref('')
const displayNameEdit = ref('')
const isEditingName = ref(false)
const isSavingName = ref(false)

const startEditName = () => {
  displayNameEdit.value = displayName.value
  isEditingName.value = true
}
const cancelEditName = () => { isEditingName.value = false }
const saveDisplayName = async () => {
  isSavingName.value = true
  try {
    await AuthService.setDisplayName(displayNameEdit.value)
    displayName.value = displayNameEdit.value.trim()
    isEditingName.value = false
    notify('Имя сохранено', 'success')
  } catch (e: any) {
    notify('Не удалось сохранить имя', 'error')
  } finally {
    isSavingName.value = false
  }
}

// Personal info
interface PersonalProfile {
  first_name: string
  last_name: string
  gender: string
  birth_date: string
}
const profile = ref<PersonalProfile>({ first_name: '', last_name: '', gender: '', birth_date: '' })
const profileEdit = ref<PersonalProfile>({ first_name: '', last_name: '', gender: '', birth_date: '' })
const isEditingProfile = ref(false)
const isSavingProfile = ref(false)

const genderOptions = [
  { value: 'male',   label: 'Мужской' },
  { value: 'female', label: 'Женский' },
  { value: 'other',  label: 'Другой' },
]

function genderLabel(g: string | null) {
  return genderOptions.find(o => o.value === g)?.label ?? '—'
}

function formatBirthDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

const startEditProfile = () => {
  profileEdit.value = { ...profile.value }
  isEditingProfile.value = true
}
const cancelEditProfile = () => { isEditingProfile.value = false }
const savePersonalProfile = async () => {
  isSavingProfile.value = true
  try {
    await AuthService.saveProfile({
      first_name: profileEdit.value.first_name.trim() || null,
      last_name:  profileEdit.value.last_name.trim()  || null,
      gender:     profileEdit.value.gender || null,
      birth_date: profileEdit.value.birth_date || null,
    })
    profile.value = { ...profileEdit.value }
    isEditingProfile.value = false
    notify('Данные сохранены', 'success')
  } catch (e: any) {
    notify('Не удалось сохранить данные', 'error')
  } finally {
    isSavingProfile.value = false
  }
}

onMounted(async () => {
  try {
    const { user: authUser } = await AuthService.getUser()
    if (authUser) {
      user.value.email = authUser.email || ''
      user.value.id = authUser.id
      user.value.role = authUser.role || 'Пользователь'
    }

    const [rawStats, profileData] = await Promise.all([
      AuthService.getUserStats(),
      AuthService.getProfile()
    ])
    displayName.value = profileData.display_name || ''
    profile.value = {
      first_name: profileData.first_name || '',
      last_name:  profileData.last_name  || '',
      gender:     profileData.gender     || '',
      birth_date: profileData.birth_date || '',
    }
    if (rawStats) {
      stats.value = rawStats
    }
    activityFeed.value = await AuthService.getUserActivity()
    try {
      pendingProducts.value = await CatalogService.getPendingProductsForModeration()
    } catch (err: any) {
      pendingError.value = err?.message || 'Не удалось загрузить модерацию'
      notify(pendingError.value, 'error')
    }
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="profile-view">
    <!-- Header -->
    <section class="profile-header">
      <div class="avatar-placeholder">
        {{ user.email.charAt(0).toUpperCase() }}
      </div>
      <div class="user-info">
        <!-- Display name -->
        <div v-if="!isEditingName" class="display-name-row">
          <h1>{{ displayName || user.email.split('@')[0] }}</h1>
          <button class="edit-name-btn" @click="startEditName" title="Изменить имя">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
        <div v-else class="display-name-edit">
          <input v-model="displayNameEdit" class="name-input" placeholder="Введите имя" maxlength="32"
            @keydown.enter="saveDisplayName" @keydown.escape="cancelEditName" />
          <button class="name-save-btn" @click="saveDisplayName" :disabled="isSavingName">✓</button>
          <button class="name-cancel-btn" @click="cancelEditName">✕</button>
        </div>
        <p class="email">{{ user.email }}</p>
        <div class="badges">
          <span class="badge" v-if="stats">⭐ {{ stats.reputation }} Репутация</span>
          <span class="badge id-badge" title="User ID">🆔 {{ user.id.slice(0, 8) }}...</span>
        </div>
      </div>
    </section>

    <!-- Stats Grid -->
    <section class="stats-grid" v-if="stats">
      <!-- Level Card -->
      <FpCard class="stat-card level-card">
        <div class="level-info">
          <span class="level-number">Lvl {{ stats.level }}</span>
          <span class="level-title">{{ stats.levelTitle }}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar"
            :style="{ width: Math.min((stats.reputation / stats.nextLevelThreshold) * 100, 100) + '%' }">
          </div>
        </div>
        <span class="xp-text">{{ stats.reputation }} / {{ stats.nextLevelThreshold }} XP</span>
      </FpCard>

      <FpCard class="stat-card">
        <span class="stat-value">{{ stats.pricesSubmitted }}</span>
        <span class="stat-label">Цен добавлено</span>
      </FpCard>
      <FpCard class="stat-card" @click="router.push('/favorites')" style="cursor: pointer">
        <span class="stat-value">⭐</span>
        <span class="stat-label">Избранное</span>
      </FpCard>
    </section>

    <!-- Personal Info -->
    <section class="personal-info-section">
      <div class="section-title-row">
        <h2>Личные данные</h2>
        <button v-if="!isEditingProfile" class="edit-profile-btn" @click="startEditProfile">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Изменить
        </button>
      </div>

      <FpCard v-if="!isEditingProfile" class="info-card">
        <div class="info-row">
          <span class="info-label">Имя</span>
          <span class="info-value">{{ profile.first_name || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Фамилия</span>
          <span class="info-value">{{ profile.last_name || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Пол</span>
          <span class="info-value">{{ genderLabel(profile.gender) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Дата рождения</span>
          <span class="info-value">{{ formatBirthDate(profile.birth_date) }}</span>
        </div>
      </FpCard>

      <FpCard v-else class="info-card edit-mode">
        <div class="edit-field">
          <label class="field-label">Имя</label>
          <input v-model="profileEdit.first_name" class="field-input" placeholder="Введите имя" maxlength="64" />
        </div>
        <div class="edit-field">
          <label class="field-label">Фамилия</label>
          <input v-model="profileEdit.last_name" class="field-input" placeholder="Введите фамилию" maxlength="64" />
        </div>
        <div class="edit-field">
          <label class="field-label">Пол</label>
          <div class="gender-options">
            <button v-for="g in genderOptions" :key="g.value"
              class="gender-btn" :class="{ active: profileEdit.gender === g.value }"
              @click="profileEdit.gender = profileEdit.gender === g.value ? '' : g.value">
              {{ g.label }}
            </button>
          </div>
        </div>
        <div class="edit-field">
          <label class="field-label">Дата рождения</label>
          <input type="date" v-model="profileEdit.birth_date" class="field-input" />
        </div>
        <div class="edit-actions">
          <button class="cancel-btn" @click="cancelEditProfile">Отмена</button>
          <button class="save-btn" @click="savePersonalProfile" :disabled="isSavingProfile">Сохранить</button>
        </div>
      </FpCard>
    </section>

    <!-- Currency Settings -->
    <section class="settings-section">
      <h2>Валюта отображения</h2>
      <div class="currency-options">
        <button v-for="c in currencies" :key="c.code" class="currency-option-btn"
          :class="{ active: currentCurrency === c.code }" @click="changeCurrency(c.code)">
          <span class="currency-symbol">{{ c.symbol }}</span>
          <span class="currency-code">{{ c.code }}</span>
          <span class="currency-label">{{ c.label }}</span>
        </button>
      </div>
      <p class="settings-saved" v-if="currencySaved">✓ Сохранено</p>

      <!-- Exchange Rates -->
      <div class="rates-section">
        <p class="rates-hint">Курс к рублю</p>
        <div class="rates-inputs">
          <FpNumberInput v-model="usdRate" label="1 $ в рублях" :min="1" :step="0.5" />
          <FpNumberInput v-model="eurRate" label="1 € в рублях" :min="1" :step="0.5" />
        </div>
        <button class="save-rates-btn" @click="saveRates">Применить курсы</button>
        <p class="settings-saved" v-if="ratesSaved">✓ Сохранено</p>
      </div>
    </section>

    <section class="activity-section">
      <div class="section-title-row">
        <h2>Последняя активность</h2>
        <FpButton variant="text" size="sm" @click="router.push('/activity')">Смотреть всё</FpButton>
      </div>
      <div class="activity-list">
        <div v-if="activityFeed.length === 0" class="empty-feed">
          Нет активности
        </div>
        <FpCard v-for="act in activityFeed" :key="act.id" class="activity-item" padding="sm">
          <div class="act-icon">{{ act.icon }}</div>
          <div class="act-content">
            <div class="act-header">
              <span class="act-action">{{ act.action }}</span>
              <span class="act-time">{{ act.time }}</span>
            </div>
            <span class="act-item">{{ act.item }}</span>
            <span class="act-details">{{ formatPrice(act.price) }}</span>
          </div>
        </FpCard>
      </div>
    </section>

    <section class="moderation-section">
      <div class="section-title-row">
        <h2>На модерации</h2>
        <span class="caption" v-if="pendingProducts.length">Товары других пользователей, пока не в статистике</span>
      </div>

      <div v-if="pendingError" class="error-alert">{{ pendingError }}</div>

      <div v-else-if="pendingProducts.length === 0" class="empty-feed">
        Всё чисто — новых товаров для модерации нет.
      </div>

      <div v-else class="pending-list">
        <FpCard v-for="p in pendingProducts" :key="p.id" class="pending-item" padding="sm">
          <div class="pending-main">
            <div class="pending-name">{{ p.name }}</div>
            <div class="pending-meta">
              <span class="badge muted">Категория: {{ p.category || '—' }}</span>
              <span class="badge warning">На модерации</span>
            </div>
          </div>
          <div class="pending-date">{{ new Date(p.created_at).toLocaleDateString('ru-RU') }}</div>
        </FpCard>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.profile-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: 0 0.5rem; // Add horizontal padding for mobile
  width: 100%;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  background: var(--color-surface);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-1);
  position: relative;
  overflow: hidden;

  // Decorative geometric shape
  &::after {
    content: '';
    position: absolute;
    bottom: -20%;
    right: -5%;
    width: 300px;
    height: 300px;
    background: linear-gradient(45deg, rgba(108, 93, 211, 0.05), rgba(0, 210, 160, 0.05));
    border-radius: 50%;
    z-index: 0;
  }

  .avatar-placeholder {
    min-width: 4rem;
    min-height: 4rem;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-variant));
    color: white;
    border-radius: var(--radius-md); // Squircle
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    font-weight: 700;
    box-shadow: var(--shadow-2);
    z-index: 1;
  }

  .user-info {
    z-index: 1;

    h1 {
      margin: 0;
      font-size: var(--text-h3);
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .email {
      color: var(--color-text-secondary);
      margin: 4px 0 12px;
      font-size: var(--text-body-1);
    }
  }

  .badges {
    display: flex;
    gap: var(--spacing-sm);

    .badge {
      background: var(--color-background);
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      font-size: var(--text-caption);
      font-weight: 600;
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-sm);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    gap: 4px;
    text-align: center;
    background: var(--color-surface);
    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
    transition: all 0.2s;
    min-height: 100px;
    border-radius: 14px;

    &:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-1);
      transform: translateY(-1px);
    }

    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: var(--color-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: var(--text-caption);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
  }

  .level-card {
    grid-column: span 2;

    .level-info {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 6px;
    }

    .level-number {
      font-size: 20px;
      font-weight: 800;
      color: var(--color-primary);
    }

    .level-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .progress-bar-container {
      width: 100%;
      height: 6px;
      background: var(--color-background);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
      transition: width 0.5s ease-out;
    }

    .xp-text {
      font-size: 0.95rem;
      color: var(--color-text-secondary);
    }
  }
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  h2 {
    font-size: var(--text-h5);
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.2px;
  }
}

.currency-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
}

.currency-option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  background: linear-gradient(180deg, var(--color-surface), rgba(var(--color-primary-rgb), 0.02));
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s, background 0.15s;
  min-height: 92px;

  &.active {
    border-color: var(--color-primary);
    background: radial-gradient(circle at 30% 20%, rgba(var(--color-primary-rgb), 0.12), rgba(var(--color-primary-rgb), 0.04) 55%, transparent 80%),
      linear-gradient(180deg, var(--color-surface), rgba(var(--color-primary-rgb), 0.06));
    box-shadow: 0 10px 20px rgba(var(--color-primary-rgb), 0.18);
    transform: translateY(-2px);
  }

  .currency-symbol {
    font-size: 20px;
    font-weight: 800;
    color: var(--color-primary);
  }

  .currency-code {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .currency-label {
    font-size: 11px;
    color: var(--color-text-secondary);
  }
}

.settings-saved {
  margin-top: var(--spacing-sm);
  font-size: 13px;
  color: var(--color-success);
  font-weight: 600;
}

.rates-section {
  margin-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.rates-hint {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rates-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.rate-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;

  label {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
  }

  span {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

.rate-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.save-rates-btn {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.85;
  }
}

.activity-section {
  h2 {
    font-size: var(--text-h5);
    font-weight: 700;
    margin: 0;
  }

  .section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.empty-feed {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.activity-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  border: 1px solid var(--color-border); // Visible border
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-1);
  }

  .act-icon {
    font-size: 24px;
    background: var(--color-background);
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }

  .act-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .act-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .act-action {
      font-weight: 700;
      font-size: var(--text-button);
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .act-time {
      font-size: var(--text-caption);
      color: var(--color-text-disabled);
    }
  }

  .act-item {
    font-weight: 600;
    font-size: var(--text-body-1);
    color: var(--color-text-primary);
  }

  .act-details {
    font-size: var(--text-body-2);
    color: var(--color-text-secondary);
  }
}

.moderation-section {
  .section-title-row {
    display: flex;
    align-items: center;
    gap: 12px;

    .caption {
      color: var(--color-text-secondary);
      font-size: 13px;
    }
  }
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-1);
  }
}

.pending-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pending-name {
  font-weight: 700;
  font-size: var(--text-body-1);
}

.pending-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pending-date {
  color: var(--color-text-secondary);
  font-size: var(--text-caption);
}

.badge.warning {
  background: rgba(var(--color-error-rgb, 255, 87, 87), 0.12);
  color: var(--color-error);
}

.badge.muted {
  background: var(--color-background);
  color: var(--color-text-secondary);
}

.display-name-row {
  display: flex;
  align-items: center;
  gap: 8px;

  h1 { margin: 0; }
}

.edit-name-btn {
  background: none;
  border: none;
  padding: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;

  &:hover { color: var(--color-primary); }
}

.display-name-edit {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name-input {
  border: 1.5px solid var(--color-primary);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 1.1rem;
  font-weight: 700;
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
  width: 160px;
}

.name-save-btn,
.name-cancel-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 14px;
  cursor: pointer;
  color: var(--color-text-secondary);

  &:hover { border-color: var(--color-primary); color: var(--color-primary); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.personal-info-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  h2 {
    font-size: var(--text-h5);
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.2px;
  }

  .section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.edit-profile-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: var(--color-primary); color: var(--color-primary); }
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child { border-bottom: none; }
}

.info-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.edit-mode {
  gap: var(--spacing-md);
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 15px;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.gender-options {
  display: flex;
  gap: 8px;
}

.gender-btn {
  flex: 1;
  padding: 8px 4px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;

  &.active {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.08);
    color: var(--color-primary);
    font-weight: 700;
  }
}

.edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.cancel-btn {
  flex: 1;
  padding: 11px;
  border: 1.5px solid var(--color-border);
  border-radius: 12px;
  background: none;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover { border-color: var(--color-text-secondary); }
}

.save-btn {
  flex: 2;
  padding: 11px;
  border: none;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:active:not(:disabled) { opacity: 0.85; }
}
</style>
