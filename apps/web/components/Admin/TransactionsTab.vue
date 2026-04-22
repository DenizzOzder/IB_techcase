<template>
  <div class="space-y-6">
    <div v-if="isFetching && transactions.length === 0" class="flex flex-col items-center justify-center py-24">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mb-4"></div>
      <p class="text-gray-500 font-medium">Veriler getiriliyor...</p>
    </div>

    <div v-else-if="transactions.length === 0" class="flex flex-col items-center justify-center py-32 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 bg-surface/20">
      <span class="text-6xl mb-6 opacity-30">📁</span>
      <p class="text-xl font-bold text-gray-400">Görüntülenecek işlem bulunamadı.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <TransactionCard 
        v-for="tx in transactions" 
        :key="tx._id" 
        :item="tx"
        @advance="$emit('advance', tx)"
        @cancel="$emit('cancel', tx)"
        @rollback="$emit('rollback', tx)"
      />
    </div>

    <!-- LOAD MORE -->
    <div v-if="hasMore && transactions.length > 0" class="flex justify-center pt-8">
      <BaseButton 
        variant="secondary" 
        :loading="isFetching" 
        @click="$emit('load-more')"
        class="px-8 py-3 rounded-full border-2"
      >
        Daha Fazla Yükle
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ITransaction } from '@repo/types';

defineProps<{
  transactions: ITransaction[];
  isFetching: boolean;
  hasMore?: boolean;
}>();

defineEmits<{
  (e: 'advance', tx: ITransaction): void;
  (e: 'cancel', tx: ITransaction): void;
  (e: 'rollback', tx: ITransaction): void;
  (e: 'load-more'): void;
}>();
</script>
