<template>
  <div class="h-64 w-full">
    <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
    <div v-else class="h-full w-full flex items-center justify-center text-gray-400 text-xs italic">
      Veri yükleniyor...
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'vue-chartjs';
import { IStatsTrendItem } from '@repo/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const props = defineProps<{
  trendData: IStatsTrendItem[];
}>();

const chartData = computed(() => {
  if (!props.trendData || props.trendData.length === 0) return null;

  return {
    labels: props.trendData.map(d => d.label),
    datasets: [
      {
        label: 'Satış Hacmi (₺)',
        data: props.trendData.map(d => d.volume),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Komisyon (₺)',
        data: props.trendData.map(d => d.commission),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderRadius: 4,
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false
      },
      ticks: {
        font: { size: 10 }
      }
    },
    y: {
      display: true,
      beginAtZero: true,
      grid: {
        color: 'rgba(200, 200, 200, 0.1)'
      },
      ticks: {
        font: { size: 10 },
        callback: (val: number | string) => {
          if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
          if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
          return val;
        }
      }
    }
  }
};
</script>
