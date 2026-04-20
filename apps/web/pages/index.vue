<template>
  <main class="min-h-screen pt-12 pb-24 px-6 md:px-12 relative overflow-hidden">
    <!-- Dekoratif Glassmorphism Renk Hüzmeleri (Background Glows) -->
    <div class="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[100px]"></div>
    <div class="pointer-events-none absolute top-40 -right-20 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]"></div>
    
    <div class="mx-auto max-w-5xl relative z-10">
      
      <!-- Başlık ve Tema (Top Header Section) -->
      <header class="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-text to-gray-500 bg-clip-text text-transparent dark:to-gray-400">
            Emlak Operasyon Paneli
          </h1>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Aktif anlaşmalarınızı, tapu işlemlerinizi ve komisyon hakedişlerinizi buradan pratikçe yönetin.
          </p>
        </div>
        
        <!-- Dark/Light Tema Değiştirici -->
        <button 
          @click="toggleTheme" 
          class="rounded-full p-2.5 backdrop-blur-md border border-surface bg-surface/50 text-text shadow-sm hover:scale-105 transition-transform"
        >
          <span v-if="$colorMode.value === 'dark'">☀️ Açık Tema</span>
          <span v-else>🌙 Koyu Tema</span>
        </button>
      </header>

      <!-- İşlemler Listesi (Transactions Grid) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Transaction Card (Atomic olmayan, sayfaya özel yapıdır) -->
        <div 
          v-for="item in transactions" 
          :key="item._id"
          class="relative overflow-hidden rounded-2xl border border-white/50 bg-surface/60 p-6 shadow-xl shadow-gray-200/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/60 dark:shadow-gray-900/50"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold tracking-tight text-text">{{ item.propertyTitle }}</h2>
            <!-- Tip Güvenli Status Badge Bileşeni -->
            <StatusBadge :status="item.status" />
          </div>

          <div class="space-y-3 mb-8 text-sm text-gray-600 dark:text-gray-300">
            <p class="flex justify-between items-center rounded-lg bg-gray-50/50 p-2 dark:bg-gray-900/30">
              <span>Danışman:</span> <span class="font-semibold text-text">{{ item.agentName }}</span>
            </p>
            <p class="flex justify-between items-center rounded-lg bg-gray-50/50 p-2 dark:bg-gray-900/30">
              <span>Mülk Bedeli:</span> <span class="font-semibold text-text">{{ formatCurrency(item.propertyPrice) }}</span>
            </p>
            <p class="flex justify-between items-center rounded-lg bg-gray-50/50 p-2 dark:bg-gray-900/30">
              <span>Komisyon (%):</span> <span class="font-semibold text-text">%{{ item.commissionRate }}</span>
            </p>
          </div>

          <!-- Component'e bağlanan Aksiyonlar -->
          <div class="flex items-center gap-3 border-t border-gray-200/50 dark:border-gray-700/50 pt-5">
            <BaseButton 
              v-if="item.status !== TransactionStatus.COMPLETED"
              variant="primary" 
              :loading="isFetching" 
              @click="advanceStatus(item)"
              class="w-full"
            >
              Sonraki Aşamaya İlerlet ({{ getNextStepName(item.status) }})
            </BaseButton>

            <BaseButton 
              v-else
              variant="outline" 
              disabled
              class="w-full"
            >
              Süreç Kapandı & Komisyon Aktarıldı
            </BaseButton>
          </div>
        </div>

      </div>

    </div>
  </main>
</template>

<script setup lang="ts">
import { useTransactions } from '@/composables/useTransactions';
import { TransactionStatus } from '@repo/types';

// API isteği Hook içerisinden beslenir. Component tertemizdir.
const { transactions, isFetching, updateStatus } = useTransactions();

// Türk Lirası Formatlayıcı
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
}

// State Machine akışına göre sıradaki aşama ismini verir
const getNextStepName = (currentStatus: TransactionStatus) => {
  const stepNames: Record<string, string> = {
    [TransactionStatus.AGREEMENT]: 'Kapora Al',
    [TransactionStatus.EARNEST_MONEY]: 'Tapu Devrine Geç',
    [TransactionStatus.TITLE_DEED]: 'İşlemi Tamamla'
  };
  return stepNames[currentStatus] || '';
}

// Backend ile haberleşecek durum atlatma fonksiyonu
const advanceStatus = async (item: any) => {
  const steps = [
    TransactionStatus.AGREEMENT, 
    TransactionStatus.EARNEST_MONEY, 
    TransactionStatus.TITLE_DEED, 
    TransactionStatus.COMPLETED
  ];
  
  const currentIndex = steps.indexOf(item.status);
  if (currentIndex < steps.length - 1) {
    const nextStatus = steps[currentIndex + 1];
    await updateStatus(item._id, nextStatus);
  }
}

// Nuxt Color-Mode Adaptasyonu (Dynamic Dark/Light Tema)
const colorMode = useColorMode();
const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>
