<template>
  <div class="group relative overflow-hidden rounded-[2rem] bg-white/40 border border-white/50 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:-translate-y-1 dark:bg-gray-800/40 dark:border-gray-700/50">
    <div class="flex items-start justify-between mb-6">
      <div class="space-y-1">
        <h3 class="text-xl font-bold text-text line-clamp-1" :title="item.propertyTitle">{{ item.propertyTitle }}</h3>
        <p class="text-sm font-semibold text-primary-500">{{ formatCurrency(item.propertyPrice) }}</p>
      </div>
      <StatusBadge :status="item.status" />
    </div>

    <!-- İşlem Detayları -->
    <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
      <div v-if="authStore.isAdmin" class="p-3 rounded-2xl bg-white/50 border border-white/30 dark:bg-gray-900/50 dark:border-gray-700/50">
        <p class="text-[10px] uppercase font-bold text-gray-400 mb-1">Danışman</p>
        <p class="font-medium text-text truncate" :title="item.agentName">{{ item.agentName || 'Bilinmiyor' }}</p>
      </div>
      
      <div class="p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-center"
           :class="[
             item.status === 'COMPLETED' 
               ? 'bg-success-500/10 border-success-500/30 shadow-inner shadow-success-500/10 col-span-2 items-center text-center py-4' 
               : 'bg-white/50 border-white/30 dark:bg-gray-900/50 dark:border-gray-700/50',
             !authStore.isAdmin && item.status !== 'COMPLETED' ? 'col-span-2' : ''
           ]">
        <p class="text-[10px] uppercase font-bold mb-1 flex items-center gap-1"
           :class="item.status === 'COMPLETED' ? 'text-success-600 dark:text-success-400' : 'text-gray-400'">
          {{ item.status === 'COMPLETED' ? '💰 KAZANILAN KOMİSYON' : 'Beklenen Komisyon' }} (%{{ item.commissionRate }})
        </p>
        <p v-if="item.status === 'COMPLETED' && item.calculatedCommission" class="text-2xl font-black text-success-600 dark:text-success-400">
          {{ formatCurrency(item.calculatedCommission) }}
        </p>
        <p v-else-if="item.status === 'COMPLETED'" class="font-bold text-success-500">
          Hesaplanıyor...
        </p>
        <p v-else class="font-medium text-gray-500 flex items-center gap-2">
          <span class="text-lg font-bold text-text">{{ formatCurrency(item.propertyPrice * (item.commissionRate / 100)) }}</span>
        </p>
      </div>
    </div>

    <!-- Aksiyon Butonları -->
    <div class="flex flex-wrap gap-2 mt-auto">
      <template v-if="tabType === 'company' && !authStore.isAdmin">
        <BaseButton 
          v-if="item.isCompanyListing"
          variant="primary" 
          class="w-full"
          @click="$emit('claim', item)"
        >
          🎯 Üzerime Al
        </BaseButton>

        <BaseButton 
          v-else-if="item.pendingSellingAgentId === authStore.user?._id"
          variant="secondary" 
          disabled
          class="w-full opacity-50 cursor-not-allowed"
        >
          ⏳ Talep Bekliyor
        </BaseButton>

        <BaseButton 
          v-else
          variant="primary" 
          class="w-full"
          @click="$emit('claim', item)"
        >
          🤝 Ortaklık Talep Et
        </BaseButton>
      </template>

      <template v-else-if="item.pendingSellingAgentId && item.agentId === authStore.user?._id && !authStore.isAdmin">
        <div class="w-full p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-2 text-center text-sm font-semibold text-blue-700 dark:text-blue-300">
          Ortaklık talebi geldi!
        </div>
        <BaseButton 
          variant="primary" 
          class="flex-1 min-w-[120px]"
          @click="$emit('approve-claim', item)"
        >
          ✅ Onayla
        </BaseButton>
        <BaseButton 
          variant="danger" 
          class="flex-1 min-w-[120px]"
          @click="$emit('reject-claim', item)"
        >
          ❌ Reddet
        </BaseButton>
      </template>

      <template v-else>
        <BaseButton 
          v-if="item.status !== 'COMPLETED' && item.status !== 'CANCELLED'"
          variant="primary" 
          class="flex-1 min-w-[120px] shadow-lg shadow-primary-500/20"
          @click="$emit('advance', item)"
        >
          İlerlet
        </BaseButton>

        <BaseButton 
          v-if="item.status !== 'COMPLETED' && item.status !== 'CANCELLED'"
          variant="danger" 
          class="flex-1 min-w-[120px] shadow-lg shadow-danger/20"
          @click="$emit('cancel', item)"
        >
          İptal Et
        </BaseButton>

        <BaseButton 
          v-if="item.status !== 'AGREEMENT' && item.status !== 'COMPLETED' && item.status !== 'CANCELLED'"
          variant="secondary" 
          class="w-full"
          @click="$emit('rollback', item)"
        >
          Geri Al
        </BaseButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ITransaction } from '@repo/types';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

defineProps<{
  item: ITransaction;
  tabType?: 'my' | 'company' | 'all';
}>();

defineEmits<{
  (e: 'advance', item: ITransaction): void;
  (e: 'cancel', item: ITransaction): void;
  (e: 'rollback', item: ITransaction): void;
  (e: 'claim', item: ITransaction): void;
  (e: 'approve-claim', item: ITransaction): void;
  (e: 'reject-claim', item: ITransaction): void;
}>();

const formatCurrency = (val: number) => {
  if (!val) return '₺0';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
};
</script>
