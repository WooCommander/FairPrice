<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, RefreshCcw, Lightbulb } from 'lucide-vue-next'
import { FpHaptics } from '@/shared/lib/haptics'
import confetti from 'canvas-confetti'

// Level Definitions
interface Level {
    size: number
    dots: { color: string, r: number, c: number }[]
    solutions?: Record<string, { r: number, c: number }[]>
}

const LEVELS: Level[] = [
    {
        size: 4,
        dots: [
            { color: '#ef4444', r: 0, c: 0 }, { color: '#ef4444', r: 3, c: 3 },
            { color: '#3b82f6', r: 1, c: 0 }, { color: '#3b82f6', r: 3, c: 2 },
            { color: '#22c55e', r: 2, c: 0 }, { color: '#22c55e', r: 2, c: 1 },
            { color: '#eab308', r: 3, c: 0 }, { color: '#eab308', r: 3, c: 1 }
        ]
    },
    {
        size: 5,
        dots: [
            { color: '#ef4444', r: 4, c: 4 }, { color: '#ef4444', r: 0, c: 4 },
            { color: '#3b82f6', r: 4, c: 3 }, { color: '#3b82f6', r: 0, c: 0 },
            { color: '#22c55e', r: 4, c: 2 }, { color: '#22c55e', r: 1, c: 0 },
            { color: '#eab308', r: 4, c: 1 }, { color: '#eab308', r: 2, c: 0 },
            { color: '#a855f7', r: 4, c: 0 }, { color: '#a855f7', r: 3, c: 0 }
        ]
    },
    {
        size: 6,
        dots: [
            { color: '#ef4444', r: 5, c: 5 }, { color: '#ef4444', r: 0, c: 5 },
            { color: '#3b82f6', r: 5, c: 4 }, { color: '#3b82f6', r: 0, c: 0 },
            { color: '#22c55e', r: 5, c: 3 }, { color: '#22c55e', r: 1, c: 0 },
            { color: '#eab308', r: 5, c: 2 }, { color: '#eab308', r: 2, c: 0 },
            { color: '#a855f7', r: 5, c: 1 }, { color: '#a855f7', r: 3, c: 0 },
            { color: '#f97316', r: 5, c: 0 }, { color: '#f97316', r: 4, c: 0 }
        ]
    },
    {
        size: 6,
        dots: [
            { color: '#ef4444', r: 0, c: 0 }, { color: '#ef4444', r: 4, c: 2 },
            { color: '#3b82f6', r: 0, c: 1 }, { color: '#3b82f6', r: 4, c: 4 },
            { color: '#22c55e', r: 1, c: 1 }, { color: '#22c55e', r: 2, c: 1 },
            { color: '#eab308', r: 0, c: 4 }, { color: '#eab308', r: 3, c: 4 }
        ],
        solutions: {
            '#ef4444': [{r:0,c:0},{r:1,c:0},{r:2,c:0},{r:3,c:0},{r:4,c:0},{r:4,c:1},{r:4,c:2}],
            '#3b82f6': [{r:0,c:1},{r:0,c:2},{r:0,c:3},{r:1,c:3},{r:2,c:3},{r:3,c:3},{r:4,c:3},{r:4,c:4}],
            '#22c55e': [{r:1,c:1},{r:1,c:2},{r:2,c:2},{r:3,c:2},{r:3,c:1},{r:2,c:1}],
            '#eab308': [{r:0,c:4},{r:1,c:4},{r:2,c:4},{r:3,c:4}]
        }
    },
    {
        size: 6,
        dots: [
            { color: '#ef4444', r: 0, c: 0 }, { color: '#ef4444', r: 5, c: 0 },
            { color: '#3b82f6', r: 0, c: 3 }, { color: '#3b82f6', r: 3, c: 5 },
            { color: '#22c55e', r: 0, c: 4 }, { color: '#22c55e', r: 2, c: 5 },
            { color: '#eab308', r: 2, c: 4 }, { color: '#eab308', r: 4, c: 4 },
            { color: '#a855f7', r: 1, c: 0 }, { color: '#a855f7', r: 1, c: 1 }
        ],
        solutions: {
            '#ef4444': [{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:1,c:2},{r:2,c:2},{r:3,c:2},{r:4,c:2},{r:5,c:2},{r:5,c:1},{r:5,c:0}],
            '#3b82f6': [{r:0,c:3},{r:1,c:3},{r:2,c:3},{r:3,c:3},{r:4,c:3},{r:5,c:3},{r:5,c:4},{r:5,c:5},{r:4,c:5},{r:3,c:5}],
            '#22c55e': [{r:0,c:4},{r:0,c:5},{r:1,c:5},{r:2,c:5}],
            '#eab308': [{r:2,c:4},{r:3,c:4},{r:4,c:4}],
            '#a855f7': [{r:1,c:0},{r:2,c:0},{r:3,c:0},{r:4,c:0},{r:4,c:1},{r:3,c:1},{r:2,c:1},{r:1,c:1}]
        }
    },
    {
        size: 7,
        dots: [
            { color: '#ef4444', r: 0, c: 0 }, { color: '#ef4444', r: 1, c: 6 },
            { color: '#3b82f6', r: 2, c: 6 }, { color: '#3b82f6', r: 6, c: 0 },
            { color: '#22c55e', r: 5, c: 0 }, { color: '#22c55e', r: 1, c: 1 },
            { color: '#eab308', r: 1, c: 2 }, { color: '#eab308', r: 3, c: 3 }
        ],
        solutions: {
            '#ef4444': [{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:0,c:3},{r:0,c:4},{r:0,c:5},{r:0,c:6},{r:1,c:6}],
            '#3b82f6': [{r:2,c:6},{r:3,c:6},{r:4,c:6},{r:5,c:6},{r:6,c:6},{r:6,c:5},{r:6,c:4},{r:6,c:3},{r:6,c:2},{r:6,c:1},{r:6,c:0}],
            '#22c55e': [{r:5,c:0},{r:4,c:0},{r:3,c:0},{r:2,c:0},{r:1,c:0},{r:1,c:1}],
            '#eab308': [{r:1,c:2},{r:1,c:3},{r:1,c:4},{r:1,c:5},{r:2,c:5},{r:3,c:5},{r:4,c:5},{r:5,c:5},{r:5,c:4},{r:5,c:3},{r:5,c:2},{r:5,c:1},{r:4,c:1},{r:3,c:1},{r:2,c:1},{r:2,c:2},{r:2,c:3},{r:2,c:4},{r:3,c:4},{r:4,c:4},{r:4,c:3},{r:4,c:2},{r:3,c:2},{r:3,c:3}]
        }
    }
]

const router = useRouter()

// State
const currentLevelIndex = ref(0)
const levelPassed = ref(false)

const timer = ref(0)
const totalScore = ref(0)
const bestScore = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

const gridSize = computed(() => LEVELS[currentLevelIndex.value].size)
const dots = computed(() => LEVELS[currentLevelIndex.value].dots)

// paths: Record<color, Array<{r, c}>>
const paths = ref<Record<string, {r: number, c: number}[]>>({})
const isDragging = ref(false)
const activeColor = ref<string | null>(null)
const gridRef = ref<HTMLElement | null>(null)
let cellWidth = 0

const formattedTime = computed(() => {
    const m = Math.floor(timer.value / 60)
    const s = timer.value % 60
    return `${m}:${s.toString().padStart(2, '0')}`
})

// Board initialization
const initBoard = () => {
    levelPassed.value = false
    paths.value = {}
    dots.value.forEach(d => {
        paths.value[d.color] = []
    })
    
    if (intervalId) clearInterval(intervalId)
    timer.value = 0
    intervalId = setInterval(() => {
        if (!levelPassed.value) timer.value++
    }, 1000)
    
    updateCellSize()
}

// Touch / Mouse Handling
const getCellFromEvent = (e: TouchEvent | MouseEvent) => {
    if (!gridRef.value) return null
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

    const rect = gridRef.value.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    UpdateCellSizeInner(rect.width)

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null

    const c = Math.floor(x / cellWidth)
    const r = Math.floor(y / cellWidth)
    
    // Bounds check
    if (r >= 0 && r < gridSize.value && c >= 0 && c < gridSize.value) {
        return { r, c }
    }
    return null
}

const UpdateCellSizeInner = (gridW: number) => {
    cellWidth = gridW / gridSize.value
}

const updateCellSize = () => {
    if (gridRef.value) {
        cellWidth = gridRef.value.getBoundingClientRect().width / gridSize.value
    }
}

const showHintUsed = ref(false)

const useHint = () => {
    // Стоимость подсказки
    const HINT_COST = 200
    
    const colors = Array.from(new Set(dots.value.map(d => d.color)))
    
    // Ищем незавершенные или неправильные пути
    let targetColor: string | null = null
    for (const color of colors) {
        const path = paths.value[color]
        const colorDots = dots.value.filter(d => d.color === color)
        if (!path || path.length < 2) {
            targetColor = color
            break
        }
        
        const first = path[0]
        const last = path[path.length - 1]
        
        const connectsA = (first.r === colorDots[0].r && first.c === colorDots[0].c && last.r === colorDots[1].r && last.c === colorDots[1].c)
        const connectsB = (first.r === colorDots[1].r && first.c === colorDots[1].c && last.r === colorDots[0].r && last.c === colorDots[0].c)
        
        if (!connectsA && !connectsB) {
            targetColor = color
            break
        }
    }

    if (targetColor) {
        // Уменьшаем счет
        totalScore.value -= HINT_COST
        
        // Автоматически строим путь подсказки из solution (с анимацией)
        const solutionPath = (LEVELS[currentLevelIndex.value] as any).solutions[targetColor]
        paths.value[targetColor] = solutionPath
        
        FpHaptics.success()
        
        // Показываем минус UI
        showHintUsed.value = true
        setTimeout(() => showHintUsed.value = false, 1500)

        // Проверяем победу сразу после подсказки
        checkWin()
    }
}

const startDrag = (e: TouchEvent | MouseEvent) => {
    if (levelPassed.value) return
    isDragging.value = true
    const cell = getCellFromEvent(e)
    if (!cell) return

    // Did we tap on a dot?
    const dot = dots.value.find(d => d.r === cell.r && d.c === cell.c)
    if (dot) {
        activeColor.value = dot.color
        paths.value[dot.color] = [cell] // Start new path
        FpHaptics.light()
        return
    }

    // Did we tap on an existing path? Resume tracking
    for (const [color, path] of Object.entries(paths.value)) {
        const idx = path.findIndex(p => p.r === cell.r && p.c === cell.c)
        if (idx !== -1) {
            activeColor.value = color
            paths.value[color] = path.slice(0, idx + 1) // Cut tail
            FpHaptics.light()
            return
        }
    }
}

const moveDrag = (e: TouchEvent | MouseEvent) => {
    if (!isDragging.value || !activeColor.value || levelPassed.value) return
    const cell = getCellFromEvent(e)
    if (!cell) return

    const currentPath = paths.value[activeColor.value]
    if (currentPath.length === 0) return

    const last = currentPath[currentPath.length - 1]
    
    // Have we moved to a new cell?
    if (last.r !== cell.r || last.c !== cell.c) {
        // Must be adjacent
        const isAdjacent = Math.abs(last.r - cell.r) + Math.abs(last.c - cell.c) === 1
        if (!isAdjacent) return

        // Prevent moving onto a starting dot of a different color
        const diffDot = dots.value.find(d => d.r === cell.r && d.c === cell.c && d.color !== activeColor.value)
        if (diffDot) return

        // Check crossing own path (loop back) - backtrack
        const ownIndex = currentPath.findIndex(p => p.r === cell.r && p.c === cell.c)
        if (ownIndex !== -1) {
            paths.value[activeColor.value] = currentPath.slice(0, ownIndex + 1)
            return
        }

        // Cut other paths crossed
        for (const [col, path] of Object.entries(paths.value)) {
            if (col !== activeColor.value) {
                const crossIdx = path.findIndex(p => p.r === cell.r && p.c === cell.c)
                if (crossIdx !== -1) {
                    paths.value[col] = path.slice(0, crossIdx) // Cut
                }
            }
        }

        currentPath.push(cell)
        FpHaptics.selection()

        // Have we reached the target dot?
        const targetDot = dots.value.find(d => d.r === cell.r && d.c === cell.c && d.color === activeColor.value)
        
        // Target dot found and it is not the starting dot
        if (targetDot && currentPath.length > 1) {
            activeColor.value = null // Stop drawing automagically
            isDragging.value = false
            FpHaptics.success()
            checkWin()
        }
    }
}

const endDrag = () => {
    isDragging.value = false
    activeColor.value = null
    checkWin()
}

const pipesConnected = computed(() => {
    let count = 0
    const colorGroups = Array.from(new Set(dots.value.map(d => d.color)))
    for (const color of colorGroups) {
        const path = paths.value[color]
        if (!path || path.length < 2) continue
        
        const first = path[0]
        const last = path[path.length - 1]
        const colorDots = dots.value.filter(d => d.color === color)
        
        const connectsA = (first.r === colorDots[0].r && first.c === colorDots[0].c && last.r === colorDots[1].r && last.c === colorDots[1].c)
        const connectsB = (first.r === colorDots[1].r && first.c === colorDots[1].c && last.r === colorDots[0].r && last.c === colorDots[0].c)

        if (connectsA || connectsB) count++
    }
    return count
})

const totalColors = computed(() => new Set(dots.value.map(d => d.color)).size)

const checkWin = () => {
    if (levelPassed.value) return

    // Победа засчитывается, если просто соединены все цвета (без проверки заполнения 100% поля)
    if (pipesConnected.value === totalColors.value) {
        levelPassed.value = true
        if (intervalId) clearInterval(intervalId)
        
        // Calculate points
        const basePoints = gridSize.value * 50
        const expectedTime = gridSize.value * 5 // e.g. 5x5 = 25s, 8x8 = 40s
        const speedBonus = Math.max(0, expectedTime - timer.value) * 10
        totalScore.value += basePoints + speedBonus
        
        if (totalScore.value > bestScore.value) {
            bestScore.value = totalScore.value
            localStorage.setItem('fp_flow_best', bestScore.value.toString())
        }

        FpHaptics.success()
        setTimeout(() => {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
        }, 100)
    }
}

const nextLevel = () => {
    if (currentLevelIndex.value < LEVELS.length - 1) {
        currentLevelIndex.value++
        initBoard()
    }
}

const getSvgPoints = (path: {r: number, c: number}[]) => {
    if (!path || path.length === 0) return ''
    return path.map(p => {
        // center of cell
        const cx = p.c * cellWidth + cellWidth / 2
        const cy = p.r * cellWidth + cellWidth / 2
        return `${cx},${cy}`
    }).join(' ')
}

onMounted(() => {
    const saved = localStorage.getItem('fp_flow_best')
    if (saved) bestScore.value = parseInt(saved, 10)
    initBoard()
    window.addEventListener('resize', updateCellSize)
})

onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
    window.removeEventListener('resize', updateCellSize)
})

</script>

<template>
    <div class="flow-view">
        <header class="game-header">
            <button class="icon-btn" @click="router.back()">
                <ArrowLeft :size="24" />
            </button>
            <div class="level-indicator">
                Ур. {{ currentLevelIndex + 1 }} / {{ LEVELS.length }}
            </div>
            <div class="timer-badge">
                {{ formattedTime }}
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="icon-btn" style="color: #eab308; border-color: #eab308;" @click="useHint">
                    <Lightbulb :size="24" />
                </button>
                <button class="icon-btn restart-btn" @click="initBoard()">
                    <RefreshCcw :size="24" />
                </button>
            </div>
        </header>

        <div class="stats-panel" style="position: relative;">
            <div class="stat-badge score-badge">
                Счет: {{ totalScore }}
            </div>
            <div class="stat-badge" :class="{'completed': pipesConnected === totalColors}">
                Соединения: {{ pipesConnected }} / {{ totalColors }}
            </div>
            
            <Transition name="fade-up">
                <div v-if="showHintUsed" class="hint-minus">
                    -200
                </div>
            </Transition>
        </div>

        <div class="board-container">
            <div 
                class="grid-board" 
                ref="gridRef"
                :style="{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }"
                @mousedown="startDrag"
                @mousemove="moveDrag"
                @mouseup="endDrag"
                @mouseleave="endDrag"
                @touchstart.prevent="startDrag"
                @touchmove.prevent="moveDrag"
                @touchend.prevent="endDrag"
                @touchcancel="endDrag"
            >
                <!-- Cells underneath -->
                <div v-for="r in gridSize" :key="'row-'+r" class="row-group" style="display: contents;">
                    <div v-for="c in gridSize" :key="`cell-${r-1}-${c-1}`" class="grid-cell">
                        <!-- Dot check -->
                        <div v-for="dot in dots" :key="'dot' + dot.r + dot.c" 
                             v-show="dot.r === r-1 && dot.c === c-1" 
                             class="dot" 
                             :style="{ backgroundColor: dot.color, filter: `drop-shadow(0 4px 12px ${dot.color}80)` }">
                        </div>
                        
                        <!-- Path head check (to make a nice bulb at the end of pipes if needed) -->
                    </div>
                </div>

                <!-- SVG overlay for paths -->
                <svg class="path-svg">
                    <polyline 
                        v-for="(path, color) in paths" 
                        :key="color"
                        :points="getSvgPoints(path)" 
                        :stroke="color" 
                        stroke-width="16" 
                        fill="none" 
                        stroke-linecap="round" 
                        stroke-linejoin="round"
                        class="pipe-line"
                    />
                </svg>
            </div>
        </div>

        <!-- Level Passed Modal -->
        <transition name="fade">
            <div v-if="levelPassed" class="game-over-overlay">
                <div class="game-over-card">
                    <h2 class="title text-success">Уровень Пройден!</h2>
                    <p class="result-text">Отличная работа! Все цвета соединены.</p>
                    
                    <button v-if="currentLevelIndex < LEVELS.length - 1" class="game-btn success" @click="nextLevel">
                        Следующий уровень
                    </button>
                    <button v-else class="game-btn primary" @click="router.push('/games')">
                        Вы прошли всё! Вернуться
                    </button>
                </div>
            </div>
        </transition>

    </div>
</template>

<style scoped lang="scss">
.flow-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: calc(100vh - 64px); 
    padding: var(--spacing-md);
    position: relative;
    background: var(--color-background);
    touch-action: none; // Essential for touch games
    overflow: hidden;
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
    z-index: 10;
}

.level-indicator {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-text-primary);
}

.timer-badge {
    background: var(--color-background);
    padding: 6px 14px;
    border-radius: 99px;
    font-family: monospace;
    font-weight: 900;
    font-size: 1.2rem;
    color: var(--color-primary);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid var(--color-border);
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
    transition: all 0.2s;

    &:hover { background: var(--color-surface-hover); }
}

.stats-panel {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    z-index: 10;
}

.stat-badge {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: 8px 16px;
    border-radius: 99px;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text-secondary);
    transition: all 0.3s ease;
    
    &.score-badge {
        color: #f59e0b;
        border-color: #f59e0b;
        background: color-mix(in srgb, #f59e0b 10%, transparent);
    }

    &.completed {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        border-color: var(--color-success);
        color: var(--color-success);
    }
}

.board-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
}

.grid-board {
    display: grid;
    width: 100%;
    aspect-ratio: 1 / 1;
    background: var(--color-surface);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-lg);
    position: relative;
    box-shadow: inset 0 0 0 2px var(--color-border), 0 20px 40px rgba(0,0,0,0.1);
    user-select: none;
    overflow: hidden; // Keep lines inside
}

.grid-cell {
    border: 1px dashed color-mix(in srgb, var(--color-border) 50%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.dot {
    width: 60%;
    height: 60%;
    border-radius: 50%;
    position: absolute;
    z-index: 2; // Above pipes
    box-shadow: inset 0 -4px 8px rgba(0,0,0,0.2);
    border: 3px solid rgba(255,255,255,0.1);
}

.path-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; // let grid cells capture pointer
    z-index: 1;
}

.pipe-line {
    opacity: 0.9;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.game-over-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(var(--color-background-rgb), 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 20;
    gap: var(--spacing-lg);

    h2 {
        font-size: 2rem;
        color: var(--color-success);
        margin: 0;
        text-shadow: 0 4px 12px rgba(var(--color-success-rgb), 0.3);
    }
}

.hint-minus {
    position: absolute;
    top: -30px;
    right: 20px;
    color: var(--color-danger);
    font-weight: 900;
    font-size: 1.5rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    pointer-events: none;
}

.fade-up-enter-active,
.fade-up-leave-active {
    transition: all 0.5s ease;
}
.fade-up-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
.fade-up-leave-to {
    opacity: 0;
    transform: translateY(-20px);
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

    .title { font-size: 2rem; font-weight: 900; margin-bottom: var(--spacing-md); }
    .result-text { font-size: 1.1rem; color: var(--color-text-secondary); margin-bottom: var(--spacing-xl); }
}

.game-btn {
    width: 100%; padding: 16px; border-radius: var(--radius-md);
    font-weight: 700; font-size: 1.1rem; border: none; cursor: pointer; transition: all 0.2s;
    
    &.primary { background: var(--color-primary); color: var(--color-on-primary); }
    &.success { background: var(--color-success); color: white; }
    
    &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    &:active { transform: translateY(0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
