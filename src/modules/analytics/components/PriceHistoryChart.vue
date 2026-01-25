<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import type { PricePoint } from '../services/AnalyticsService'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

interface Props {
    data: PricePoint[]
}

const props = defineProps<Props>()

const chartData = computed(() => ({
    labels: props.data.map(d => d.date),
    datasets: [
        {
            label: 'Price (UZS)',
            backgroundColor: '#6200ee',
            borderColor: '#6200ee',
            data: props.data.map(d => d.price),
            tension: 0.3,
            fill: false
        }
    ]
}))

const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    }
}
</script>

<template>
    <div class="chart-container">
        <Line :data="chartData" :options="chartOptions" />
    </div>
</template>

<style scoped>
.chart-container {
    height: 250px;
    width: 100%;
}
</style>
