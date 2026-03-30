<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { CatalogService, type ProductDTO } from '@/modules/catalog/services/CatalogService'
import { FpHaptics } from '@/shared/lib/haptics'
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-vue-next'
import confetti from 'canvas-confetti'

const router = useRouter()

const isLoading = ref(true)
const products = ref<ProductDTO[]>([])
const score = ref(0)
const bestScore = ref(0) // Optionally save to localStorage
const isGameOver = ref(false)

const productA = ref<ProductDTO | null>(null)
const productB = ref<ProductDTO | null>(null)

// Game states: 'playing', 'reveal'
const gameState = ref<'playing' | 'reveal'>('playing')
const lastGuess = ref<'correct' | 'wrong' | null>(null)

const loadProducts = async () => {
    try {
        isLoading.value = true
        // Fetch a pool of products
        const res = await CatalogService.searchProducts('', {}, 1, 100)
        
        // Filter those with valid prices
        products.value = res.items.filter(p => p.normalizedPrice || p.lastPrice)
        
        if (products.value.length < 2) {
            // Not enough products
            isGameOver.value = true
        } else {
            startRound()
        }
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const getRandomProduct = (excludeId?: string) => {
    let list = products.value
    if (excludeId) {
        list = list.filter(p => p.id !== excludeId)
    }
    const idx = Math.floor(Math.random() * list.length)
    return list[idx]
}

const startRound = () => {
    gameState.value = 'playing'
    lastGuess.value = null

    // If it's the first round, pick both
    if (!productA.value || isGameOver.value) {
        productA.value = getRandomProduct()
    } else {
        // Carry over product B to product A
        productA.value = productB.value
    }

    productB.value = getRandomProduct(productA.value?.id)
}

const getPriceValue = (p: ProductDTO) => {
    return p.normalizedPrice || p.lastPrice || 0
}

const handleGuess = (guess: 'higher' | 'lower') => {
    if (gameState.value !== 'playing' || !productA.value || !productB.value) return

    const priceA = getPriceValue(productA.value)
    const priceB = getPriceValue(productB.value)

    let isCorrect = false
    if (guess === 'higher' && priceB >= priceA) isCorrect = true
    if (guess === 'lower' && priceB <= priceA) isCorrect = true

    // Actually, handling exact same price: let's be generous
    if (priceA === priceB) isCorrect = true

    gameState.value = 'reveal'

    if (isCorrect) {
        lastGuess.value = 'correct'
        score.value += 1
        if (score.value > bestScore.value) {
            bestScore.value = score.value
        }
        FpHaptics.success()
        
        if (score.value % 5 === 0) {
            // Celebrate every 5 streak
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
        }

        setTimeout(() => {
            startRound()
        }, 1500)
    } else {
        lastGuess.value = 'wrong'
        FpHaptics.error()
        isGameOver.value = true
    }
}

const restartGame = () => {
    score.value = 0
    isGameOver.value = false
    startRound()
}

onMounted(() => {
    // Load best score from local storage if needed
    const savedBest = localStorage.getItem('fp_game_best_score')
    if (savedBest) bestScore.value = parseInt(savedBest, 10)

    loadProducts()
})

const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value)
}

const getUnitDisplay = (p: ProductDTO) => {
    if (p.unit === 'шт') return '1 шт'
    if (p.unit === 'кг') return '1 кг'
    if (p.unit === 'л') return '1 л'
    return p.unit
}

</script>

<template>
    <div class="game-view">
        <header class="game-header">
            <button class="icon-btn" @click="router.back()">
                <ArrowLeft :size="24" />
            </button>
            <div class="score-board">
                <div class="score-badge current">Счет: {{ score }}</div>
                <div class="score-badge best">Рекорд: {{ bestScore }}</div>
            </div>
        </header>

        <div v-if="isLoading" class="loading-state">
            <RefreshCcw class="spin-icon" :size="32" />
            <p>Загрузка товаров...</p>
        </div>

        <div v-else-if="products.length < 2 && !isLoading" class="error-state">
            <h2>Мало данных</h2>
            <p>Необходимо добавить хотя бы 2 товара с ценами в каталог, чтобы начать игру.</p>
        </div>

        <div v-else class="game-board">
            
            <!-- Product A -->
            <transition name="slide-card">
                <div v-if="productA" class="product-card card-a" :key="'a-'+productA.id">
                    <div class="card-content">
                        <h3 class="product-name">{{ productA.name }}</h3>
                        <p class="product-store" v-if="productA.lastStore">{{ productA.lastStore }}</p>
                        
                        <div class="price-reveal">
                            <span class="price-value">{{ formatPrice(getPriceValue(productA)) }}</span>
                            <span class="price-unit">за {{ getUnitDisplay(productA) }}</span>
                        </div>
                    </div>
                </div>
            </transition>

            <div class="vs-badge">VS</div>

            <!-- Product B -->
            <transition name="slide-card">
                <div v-if="productB" class="product-card card-b" :key="'b-'+productB.id">
                    <div class="card-content">
                        <h3 class="product-name">{{ productB.name }}</h3>
                        <p class="product-store" v-if="productB.lastStore">{{ productB.lastStore }}</p>
                        
                        <div class="price-reveal" v-if="gameState === 'reveal'">
                            <span class="price-value" :class="{ 'text-success': lastGuess === 'correct', 'text-error': lastGuess === 'wrong' }">
                                {{ formatPrice(getPriceValue(productB)) }}
                            </span>
                            <span class="price-unit">за {{ getUnitDisplay(productB) }}</span>
                        </div>
                        <div class="price-hidden" v-else>
                            <span class="question-mark">?</span>
                        </div>
                    </div>

                    <div class="action-buttons" v-if="gameState === 'playing' && !isGameOver">
                        <button class="guess-btn higher" @click="handleGuess('higher')">
                            <TrendingUp :size="24" />
                            <span>Дороже</span>
                        </button>
                        <button class="guess-btn lower" @click="handleGuess('lower')">
                            <TrendingDown :size="24" />
                            <span>Дешевле</span>
                        </button>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Game Over Modal -->
        <transition name="fade">
            <div v-if="isGameOver && products.length >= 2" class="game-over-overlay">
                <div class="game-over-card">
                    <h2 class="title text-error">Неверно!</h2>
                    <p class="result-text">
                        <strong>{{ productB?.name }}</strong> стоит 
                        <span class="highlight">{{ formatPrice(getPriceValue(productB!)) }}</span>, 
                        а не {{ lastGuess === 'higher' ? 'дешевле' : 'дороже' }}.
                    </p>
                    <div class="final-score">Ваш счет: <strong>{{ score }}</strong></div>
                    
                    <button class="game-btn primary" @click="restartGame">
                        Сыграть еще раз
                    </button>
                </div>
            </div>
        </transition>

    </div>
</template>

<style scoped lang="scss">
.game-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: calc(100vh - 64px); 
    padding: var(--spacing-md);
    position: relative;
    overflow: hidden;
    background: radial-gradient(circle at top right, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent);
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
    z-index: 10;
}

.icon-btn {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;

    &:hover {
        background: var(--color-surface-hover);
    }
}

.score-board {
    display: flex;
    gap: 8px;
    
    .score-badge {
        padding: 6px 12px;
        border-radius: 99px;
        font-weight: 700;
        font-size: 0.85rem;
        
        &.current {
            background: var(--color-primary);
            color: var(--color-on-primary);
        }
        
        &.best {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            color: var(--color-text-secondary);
        }
    }
}

.game-board {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    position: relative;
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
}

.vs-badge {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--color-background);
    color: var(--color-text-primary);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 1.25rem;
    z-index: 5;
    border: 2px solid var(--color-border);
    box-shadow: var(--shadow-md);
}

.product-card {
    flex: 1;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-md);
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    overflow: hidden;

    &.card-a {
        background: linear-gradient(135deg, var(--color-surface), color-mix(in srgb, var(--color-primary) 5%, transparent));
    }

    &.card-b {
        background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 5%, transparent), var(--color-surface));
    }
}

.card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
    justify-content: center;
    width: 100%;
}

.product-name {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.2;
}

.product-store {
    font-size: 0.9rem;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
}

.price-reveal {
    margin-top: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    
    .price-value {
        font-size: 2.5rem;
        font-weight: 900;
        letter-spacing: -0.02em;
        line-height: 1;
        transition: color 0.3s;
    }
    
    .price-unit {
        font-size: 1rem;
        color: var(--color-text-tertiary);
        margin-top: 4px;
        font-weight: 500;
    }
}

.price-hidden {
    margin-top: var(--spacing-lg);
    width: 80px;
    height: 80px;
    background: var(--color-background);
    border: 2px dashed var(--color-border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    .question-mark {
        font-size: 2.5rem;
        font-weight: 900;
        color: var(--color-text-tertiary);
    }
}

.action-buttons {
    display: flex;
    gap: var(--spacing-md);
    width: 100%;
    margin-top: var(--spacing-xl);
}

.guess-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-weight: 700;
    font-size: 1.1rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: white;

    &.higher {
        background: linear-gradient(135deg, var(--color-error), #fb7185);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--color-error) 40%, transparent);

        &:hover, &:active {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px color-mix(in srgb, var(--color-error) 60%, transparent);
        }
    }

    &.lower {
        background: linear-gradient(135deg, var(--color-success), #34d399);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--color-success) 40%, transparent);

        &:hover, &:active {
            transform: translateY(2px);
            box-shadow: 0 6px 16px color-mix(in srgb, var(--color-success) 60%, transparent);
        }
    }
    
    &:active {
        transform: scale(0.96);
    }
}

.game-over-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: color-mix(in srgb, var(--color-background) 80%, transparent);
    backdrop-filter: blur(8px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-lg);
}

.game-over-card {
    background: var(--color-surface);
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-xl);
    text-align: center;
    max-width: 400px;
    width: 100%;

    .title {
        font-size: 2rem;
        font-weight: 900;
        margin-bottom: var(--spacing-md);
    }

    .result-text {
        font-size: 1.1rem;
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-lg);
        line-height: 1.5;

        .highlight {
            font-weight: 800;
            color: var(--color-text-primary);
        }
    }

    .final-score {
        font-size: 1.25rem;
        color: var(--color-text-primary);
        margin-bottom: var(--spacing-xl);
        padding: 12px;
        background: var(--color-background);
        border-radius: var(--radius-sm);
    }
}

.game-btn {
    width: 100%;
    padding: 16px;
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 1.1rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    
    &.primary {
        background: var(--color-primary);
        color: var(--color-on-primary);
        
        &:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        
        &:active {
            transform: translateY(0);
        }
    }
}

.loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--color-text-tertiary);
    gap: var(--spacing-md);
    text-align: center;
}

.spin-icon {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    100% { transform: rotate(360deg); }
}

@keyframes bounceIn {
    0% { opacity: 0; transform: scale(0.3); }
    50% { opacity: 1; transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
}

.slide-card-enter-active,
.slide-card-leave-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-card-enter-from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
}

.slide-card-leave-to {
    opacity: 0;
    transform: translateY(-50px) scale(1.05);
}

.text-success { color: var(--color-success) !important; }
.text-error { color: var(--color-error) !important; }

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

/* Add custom scrollbar hiding for clean UI */
::-webkit-scrollbar {
    display: none;
}
</style>
