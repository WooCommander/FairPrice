<script setup lang="ts">
import { computed } from 'vue'

interface ChartDataPoint {
    date: Date
    price: number
}

interface Props {
    data: ChartDataPoint[]
    height?: number
    averagePrice?: number
}

const props = withDefaults(defineProps<Props>(), {
    height: 150
})

const sortedData = computed(() => {
    return [...props.data].sort((a, b) => a.date.getTime() - b.date.getTime())
})

const points = computed(() => {
    const data = sortedData.value
    if (data.length < 2) return []

    const prices = data.map(d => d.price)
    const minPrice = Math.min(...prices) * 0.9 // 10% buffering
    const maxPrice = Math.max(...prices) * 1.1

    const startTime = data[0].date.getTime()
    const endTime = data[data.length - 1].date.getTime()
    const timeRange = endTime - startTime

    // Prevent division by zero if all prices same or time same
    const priceRange = maxPrice - minPrice || 1
    const tRange = timeRange || 1

    return data.map((d) => {
        const x = ((d.date.getTime() - startTime) / tRange) * 100 // Percentage
        // Y is inverted (0 is top)
        const y = 100 - ((d.price - minPrice) / priceRange) * 100
        return { x, y, price: d.price, date: d.date }
    })
})

const polylinePoints = computed(() => {
    return points.value.map(p => `${p.x},${p.y}`).join(' ')
})



const avgLineY = computed(() => {
    if (!props.averagePrice || points.value.length === 0) return null

    const data = sortedData.value
    const prices = data.map(d => d.price)
    const minPrice = Math.min(...prices) * 0.9
    const maxPrice = Math.max(...prices) * 1.1
    const priceRange = maxPrice - minPrice || 1

    const y = 100 - ((props.averagePrice - minPrice) / priceRange) * 100
    // Clamp to 0-100
    return Math.max(0, Math.min(100, y))
})
</script>

<template>
    <div class="price-chart-container" :style="{ height: height + 'px' }">
        <div v-if="points.length < 2" class="chart-empty">
            Недостаточно данных для графика
        </div>
        <svg v-else viewBox="0 0 100 100" preserveAspectRatio="none" class="chart-svg">
            <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
                </linearGradient>
            </defs>

            <!-- Average Line -->
            <line v-if="avgLineY !== null" x1="0" :y1="avgLineY" x2="100" :y2="avgLineY" class="avg-line"
                vector-effect="non-scaling-stroke" />

            <!-- Area Fill -->
            <polygon :points="`0,100 ${polylinePoints} 100,100`" fill="url(#chartGradient)" />

            <!-- Line -->
            <polyline :points="polylinePoints" fill="none" class="chart-line" vector-effect="non-scaling-stroke" />

            <!-- Points -->
            <circle v-for="(p, i) in points" :key="i" :cx="p.x" :cy="p.y" r="1.5" class="chart-point"
                vector-effect="non-scaling-stroke">
                <title>{{ p.price }} ₽ ({{ p.date.toLocaleDateString() }})</title>
            </circle>
        </svg>
        <div class="chart-labels" v-if="points.length >= 2">
            <span>{{ new Date(props.data[0].date).toLocaleDateString() }}</span>
            <span>{{ new Date(props.data[props.data.length - 1].date).toLocaleDateString() }}</span>
        </div>
    </div>
</template>

<style scoped lang="scss">
.price-chart-container {
    width: 100%;
    position: relative;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    margin-bottom: var(--spacing-md)
}

.chart-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}

.chart-line {
    stroke: var(--color-primary);
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.chart-point {
    fill: white;
    stroke: var(--color-primary);
    stroke-width: 2px;
    cursor: pointer;
    transition: r 0.2s;

    &:hover {
        r: 3px;
    }
}

.avg-line {
    stroke: var(--color-text-tertiary);
    stroke-width: 1px;
    stroke-dasharray: 4;
}

.chart-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-disabled);
    font-size: var(--text-caption);
}

.chart-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 10px;
    color: var(--color-text-tertiary);
}
</style>
