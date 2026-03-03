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

onMounted(async () => {
  try {
    const { user: authUser } = await AuthService.getUser()
    if (authUser) {
      user.value.email = authUser.email || ''
      user.value.id = authUser.id
      user.value.role = authUser.role || 'Пользователь'
    }

    const rawStats = await AuthService.getUserStats()
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
        <h1>{{ user.email.split('@')[0] }}</h1>
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
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
    gap: var(--spacing-xs);
    text-align: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    transition: all 0.2s;
    min-height: 120px;

    &:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-1);
      transform: translateY(-2px);
    }

    .stat-value {
      font-size: 32px; // Big number
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
    grid-column: span 3;

    @media (max-width: 768px) {
      grid-column: span 1;
    }

    .level-info {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 8px;
    }

    .level-number {
      font-size: 24px;
      font-weight: 800;
      color: var(--color-primary);
    }

    .level-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: var(--color-background);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
      transition: width 0.5s ease-out;
    }

    .xp-text {
      font-size: 1rem;
      color: var(--color-text-secondary);
    }
  }
}

.settings-section {
  h2 {
    font-size: var(--text-h5);
    font-weight: 700;
    margin: 0 0 var(--spacing-md);
  }
}

.currency-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.currency-option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-md) var(--spacing-sm);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &.active {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb, 98, 0, 238), 0.06);
  }

  .currency-symbol {
    font-size: 22px;
    font-weight: 700;
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
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
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
  padding: 10px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
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
</style>
