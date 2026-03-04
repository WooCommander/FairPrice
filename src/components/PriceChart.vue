<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    Filler,
    type ChartOptions
} from 'chart.js'

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    Filler
)

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

const chartData = computed(() => {
    const labels = sortedData.value.map(d => {
        const date = new Date(d.date)
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    })

    const dataPoints = sortedData.value.map(d => d.price)

    // primary color approximation, ideally we would read CSS variable
    const primaryColor = '#18a058'
    const primaryColorLight = 'rgba(24, 160, 88, 0.1)'

    const datasets: any[] = [
        {
            label: 'Цена',
            data: dataPoints,
            borderColor: primaryColor,
            backgroundColor: primaryColorLight,
            borderWidth: 2.5,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: primaryColor,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.3
        }
    ]

    if (props.averagePrice) {
        datasets.push({
            label: 'Средняя цена',
            data: Array(sortedData.value.length).fill(props.averagePrice),
            borderColor: 'rgba(150, 150, 150, 0.4)',
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0
        })
    }

    return {
        labels,
        datasets
    }
})

const chartOptions = computed<ChartOptions<'line'>>(() => {
    const minPrice = Math.min(...sortedData.value.map(d => d.price))
    const maxPrice = Math.max(...sortedData.value.map(d => d.price))

    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 400
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(20, 20, 20, 0.9)',
                titleFont: { size: 12, family: 'Inter, sans-serif' },
                bodyFont: { size: 14, weight: 'bold', family: 'Inter, sans-serif' },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: function (context: any) {
                        return `${context.parsed.y} ₽`
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxTicksLimit: 6,
                    font: { size: 11, family: 'Inter, sans-serif' },
                    color: '#888'
                }
            },
            y: {
                grid: {
                    color: 'rgba(150, 150, 150, 0.1)'
                },
                ticks: {
                    font: { size: 11, family: 'Inter, sans-serif' },
                    color: '#888',
                    callback: function (value: any) {
                        return `${value} ₽`
                    }
                },
                beginAtZero: false,
                suggestedMin: minPrice * 0.9,
                suggestedMax: maxPrice * 1.1
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
    }
})
</script>

<template>
    <div class="price-chart-container" :style="{ height: height + 'px' }">
        <div v-if="sortedData.length < 2" class="chart-empty">
            Недостаточно данных для графика
        </div>
        <Line v-else :data="chartData" :options="chartOptions" />
    </div>
</template>

<style scoped lang="scss">
.price-chart-container {
    width: 100%;
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
}

.chart-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-disabled);
    font-size: 13px;
    background: rgba(150, 150, 150, 0.05);
    border-radius: 12px;
}
</style>
