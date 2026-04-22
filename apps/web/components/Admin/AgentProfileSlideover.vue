<template>
  <Transition name="slide-over">
    <div v-if="isOpen" class="fixed inset-0 z-[200] flex justify-end">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>
      
      <!-- Panel -->
      <div class="relative w-full max-w-md h-full bg-surface shadow-2xl dark:bg-gray-900 border-l border-white/10 flex flex-col">
        <!-- Panel Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 class="text-xl font-bold text-text">Danışman Profili</h2>
          <button @click="$emit('close')" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        <!-- Panel Body -->
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="isFetching" class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
          
          <div v-else-if="agent" class="space-y-8">
            <!-- Kimlik -->
            <div class="flex flex-col items-center text-center">
              <div class="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-purple-600 text-4xl font-bold text-white shadow-xl shadow-primary-500/30 mb-4">
                {{ agent.name.charAt(0).toUpperCase() }}
              </div>
              <h3 class="text-2xl font-bold text-text">{{ agent.name }}</h3>
              <p class="text-gray-500 dark:text-gray-400">{{ agent.email }}</p>
              <span 
                class="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                :class="agent.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
              >
                {{ agent.isActive ? 'Aktif Hesab' : 'Pasif' }}
              </span>
            </div>

            <!-- İstatistik Kartları -->
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                <p class="text-xs font-bold text-gray-400 uppercase mb-1">Toplam İşlem</p>
                <p class="text-2xl font-black text-text">{{ agent.stats.totalTransactions }}</p>
                <p class="text-[10px] text-gray-500 mt-1">{{ agent.stats.completedTransactions }} tamamlanan</p>
              </div>
              
              <div class="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-4">
                <p class="text-xs font-bold text-primary-500 uppercase mb-1">Komisyon Kazancı</p>
                <p class="text-xl font-black text-text truncate" :title="formatCurrency(agent.stats.totalCommission)">
                  {{ formatCurrencyShort(agent.stats.totalCommission) }}
                </p>
              </div>
              
              <div class="col-span-2 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                <p class="text-xs font-bold text-purple-500 uppercase mb-1">Toplam Satış Hacmi</p>
                <p class="text-2xl font-black text-text">
                  {{ formatCurrency(agent.stats.totalVolume) }}
                </p>
              </div>
            </div>
            
            <div class="text-xs text-gray-400 text-center pt-8 border-t border-gray-100 dark:border-gray-800">
              Kayıt Tarihi: {{ new Date(agent.createdAt).toLocaleDateString('tr-TR') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { IAgentDetailResponse } from '@repo/types';

defineProps<{
  isOpen: boolean;
  agent: IAgentDetailResponse | null;
  isFetching: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

const formatCurrencyShort = (val: number) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M ₺';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K ₺';
  return val.toString() + ' ₺';
};
</script>

<style scoped>
.slide-over-enter-active, .slide-over-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-over-enter-from, .slide-over-leave-to {
  opacity: 0;
}
.slide-over-enter-from .relative, .slide-over-leave-to .relative {
  transform: translateX(100%);
}
</style>
