<template>
  <div class="h-64 w-full">
    <Doughnut v-if="chartData" :data="chartData" :options="chartOptions" />
    <div v-else class="h-full w-full flex items-center justify-center text-gray-400 text-xs italic">
      Veri yükleniyor...
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'vue-chartjs';
import { IStatsStatusItem, TransactionStatus } from '@repo/types';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  statusData: IStatsStatusItem[];
}>();

const statusColors: Record<TransactionStatus, string> = {
  [TransactionStatus.AGREEMENT]: '#64748b', // gray
  [TransactionStatus.EARNEST_MONEY]: '#f59e0b', // amber
  [TransactionStatus.TITLE_DEED]: '#3b82f6', // blue
  [TransactionStatus.COMPLETED]: '#10b981', // green
  [TransactionStatus.CANCELLED]: '#ef4444', // red
};

const statusLabels: Record<TransactionStatus, string> = {
  [TransactionStatus.AGREEMENT]: 'Sözleşme',
  [TransactionStatus.EARNEST_MONEY]: 'Kapora',
  [TransactionStatus.TITLE_DEED]: 'Tapu',
  [TransactionStatus.COMPLETED]: 'Tamamlandı',
  [TransactionStatus.CANCELLED]: 'İptal',
};

const chartData = computed(() => {
  if (!props.statusData || props.statusData.length === 0) return null;

  return {
    labels: props.statusData.map(d => statusLabels[d.status]),
    datasets: [
      {
        data: props.statusData.map(d => d.count),
        backgroundColor: props.statusData.map(d => statusColors[d.status]),
        borderWidth: 2,
        borderColor: '#1e293b', // matches dark mode background
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#94a3b8',
        font: { size: 10 },
        padding: 10,
        usePointStyle: true,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      cornerRadius: 8,
    }
  },
  cutout: '70%',
};
</script>
