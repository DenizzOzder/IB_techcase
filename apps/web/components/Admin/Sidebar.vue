<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 ease-in-out bg-surface/80 backdrop-blur-2xl border-r border-white/20 shadow-2xl dark:bg-gray-900/80 dark:border-gray-800"
    :class="[isOpen ? 'w-80' : 'w-20']"
  >
    <!-- Toggle Button -->
    <button
      @click="isOpen = !isOpen"
      class="absolute -right-4 top-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-primary-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      :class="[!isOpen ? 'rotate-180' : '']"
    >
      <span class="text-xs">◀</span>
    </button>

    <!-- Logo Section -->
    <div class="flex items-center gap-4 px-6 py-10 overflow-hidden">
      <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg shadow-primary-500/30">
        <span class="text-xl">📊</span>
      </div>
      <Transition name="fade">
        <div v-if="isOpen" class="whitespace-nowrap">
          <h2 class="text-lg font-bold tracking-tight text-text">Admin Panel</h2>
          <p class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Dashboard v2</p>
        </div>
      </Transition>
    </div>

    <!-- Stats Section (Grafik) -->
    <div class="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
      <div v-if="isOpen" class="space-y-6">
        <!-- Monthly Trend Card -->
        <div class="rounded-2xl bg-white/40 border border-white/40 p-4 dark:bg-gray-800/40 dark:border-gray-700/40">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold text-gray-400 uppercase">Trend Analizi</span>
            <div class="flex gap-1">
              <button 
                @click="currentPeriod = 'monthly'" 
                class="px-2 py-0.5 text-[10px] rounded-md transition-colors"
                :class="currentPeriod === 'monthly' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
              >
                AY
              </button>
              <button 
                @click="currentPeriod = 'yearly'"
                class="px-2 py-0.5 text-[10px] rounded-md transition-colors"
                :class="currentPeriod === 'yearly' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
              >
                YIL
              </button>
            </div>
          </div>
          
          <AdminTrendChart v-if="stats" :trend-data="stats.trend" />
          
          <div v-if="stats" class="grid grid-cols-2 gap-2 mt-4">
            <div class="p-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <p class="text-[10px] text-blue-500 font-medium">Toplam Hacim</p>
              <p class="text-sm font-bold text-text truncate">{{ formatCurrency(stats.summary.totalVolume) }}</p>
            </div>
            <div class="p-2 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <p class="text-[10px] text-purple-500 font-medium">Komisyon</p>
              <p class="text-sm font-bold text-text truncate">{{ formatCurrency(stats.summary.totalCommission) }}</p>
            </div>
          </div>
        </div>

      </div>

      <!-- Closed Mode Icons -->
      <div v-else class="flex flex-col items-center gap-6 py-4">
        <button @click="isOpen = true" class="text-xl hover:scale-110 transition-transform">📈</button>
      </div>
    </div>

    <!-- Bottom Profile -->
    <div class="p-4 border-t border-white/10 dark:border-gray-800">
      <div class="flex items-center gap-3" :class="[!isOpen ? 'justify-center' : '']">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex-shrink-0 flex items-center justify-center font-bold text-gray-500">
          {{ authStore.displayName.charAt(0) }}
        </div>
        <div v-if="isOpen" class="overflow-hidden">
          <p class="text-sm font-bold text-text truncate">{{ authStore.displayName }}</p>
          <p class="text-[10px] text-gray-500">Yönetici</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useAdminStats } from '@/composables/useAdminStats';

const authStore = useAuthStore();
const { stats, fetchStats } = useAdminStats();

const isOpen = ref(true);
const currentPeriod = ref<'monthly' | 'yearly'>('monthly');

onMounted(() => {
  if (authStore.isAdmin) {
    fetchStats(currentPeriod.value);
  }
});

watch(currentPeriod, (newVal) => {
  fetchStats(newVal);
});

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.05);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.05);
}
</style>
