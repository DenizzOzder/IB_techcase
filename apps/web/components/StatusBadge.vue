<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm transition-all duration-300',
      statusClasses
    ]"
  >
    <!-- Durum noktası indicator -->
    <span class="mr-2 h-1.5 w-1.5 animate-pulse rounded-full" :class="indicatorColor"></span>
    {{ formattedStatus }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TransactionStatus } from '@repo/types';

const props = defineProps({
  status: {
    type: String as () => TransactionStatus,
    required: true
  }
});

// Dynamic glassmorphism utilities
const statusClasses = computed(() => {
  const map: Record<string, string> = {
    [TransactionStatus.AGREEMENT]: 'bg-primary-500/10 text-primary-600 border border-primary-500/20 dark:text-primary-400',
    [TransactionStatus.EARNEST_MONEY]: 'bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:text-purple-400',
    [TransactionStatus.TITLE_DEED]: 'bg-warning/10 text-warning-700 border border-warning/20 dark:text-warning-400',
    [TransactionStatus.COMPLETED]: 'bg-success/10 text-success-700 border border-success/20 dark:text-success-400',
    [TransactionStatus.CANCELLED]: 'bg-danger/10 text-danger-700 border border-danger/20 dark:text-danger-400'
  };
  return map[props.status] || 'bg-gray-100 text-gray-800';
});

const indicatorColor = computed(() => {
  const map: Record<string, string> = {
    [TransactionStatus.AGREEMENT]: 'bg-primary-500',
    [TransactionStatus.EARNEST_MONEY]: 'bg-purple-500',
    [TransactionStatus.TITLE_DEED]: 'bg-warning',
    [TransactionStatus.COMPLETED]: 'bg-success',
    [TransactionStatus.CANCELLED]: 'bg-danger'
  };
  return map[props.status] || 'bg-gray-500';
});

const formattedStatus = computed(() => {
  const map: Record<string, string> = {
    [TransactionStatus.AGREEMENT]: 'Anlaşma Sağlandı',
    [TransactionStatus.EARNEST_MONEY]: 'Kapora Alındı',
    [TransactionStatus.TITLE_DEED]: 'Tapuda',
    [TransactionStatus.COMPLETED]: 'Tamamlandı',
    [TransactionStatus.CANCELLED]: 'İptal'
  };
  return map[props.status] || props.status;
});
</script>
