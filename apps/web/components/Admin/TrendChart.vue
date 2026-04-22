<template>
  <div class="h-64 w-full">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
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
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { IStatsTrendItem } from '@repo/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Komisyon (₺)',
        data: props.trendData.map(d => d.commission),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
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
      display: false,
    },
    y: {
      display: false,
    }
  }
};
</script>
