<template>
  <main class="min-h-screen pt-12 pb-24 px-6 md:px-12 relative overflow-hidden">
    <!-- Dekoratif Etkiler -->
    <div class="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[100px]"></div>
    <div class="pointer-events-none absolute top-40 -right-20 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]"></div>
    
    <div class="mx-auto max-w-5xl relative z-10">
      
      <!-- HATA YAKALAYICI (Error UI Toast) -->
      <div 
        v-if="error" 
        class="mb-6 rounded-lg border-l-4 border-danger bg-danger/10 p-4 shadow-md backdrop-blur-md animate-bounce"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0 text-xl">⚠️</div>
          <div class="ml-3">
            <h3 class="text-sm font-bold text-danger-900 dark:text-danger-400">Backend Validation Hatası</h3>
            <div class="mt-1 text-sm text-danger-800 dark:text-danger-300 font-mono">{{ error }}</div>
          </div>
        </div>
      </div>

      <!-- Başlık ve Kontroller -->
      <header class="mb-10 flex flex-col md:flex-row items-start md:items-start justify-between gap-4">
        <div>
          <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-text to-gray-500 bg-clip-text text-transparent dark:to-gray-400">
            Emlak Operasyon Paneli
          </h1>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Aktif emlak işlemlerini yönetin ve test edin.
          </p>
          <div class="mt-4">
            <BaseButton variant="outline" @click="isFormOpen = !isFormOpen">
              {{ isFormOpen ? 'Kapat' : '+ Yeni İşlem Ekle' }}
            </BaseButton>
          </div>
        </div>
        
        <button 
          @click="toggleTheme" 
          class="rounded-full p-2.5 backdrop-blur-md border border-surface bg-surface/50 text-text shadow-sm hover:scale-105 transition-transform"
        >
          <span v-if="$colorMode.value === 'dark'">☀️ Açık Tema</span>
          <span v-else>🌙 Koyu Tema</span>
        </button>
      </header>

      <!-- YENİ İŞLEM FORMU (Kötü Kod Tespiti) -->
      <div v-show="isFormOpen" class="mb-8 overflow-hidden rounded-2xl border border-white/30 bg-surface/80 p-6 shadow-xl backdrop-blur-md transition-all dark:border-gray-700 dark:bg-gray-800/80">
        <h2 class="text-xl font-bold mb-4">Yeni Emlak Ekle (Validation Testi)</h2>
        <form @submit.prevent="submitForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Mülk Adı</label>
            <input v-model="formData.propertyTitle" type="text" required class="w-full rounded-md border border-gray-300 bg-transparent p-2 dark:border-gray-700" placeholder="Örn: Bebek Yalı" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Danışman Adı</label>
            <input v-model="formData.agentName" type="text" required class="w-full rounded-md border border-gray-300 bg-transparent p-2 dark:border-gray-700" placeholder="Örn: Can Deniz" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Mülk Bedeli (Eksi Sayı Test Edin)</label>
            <input v-model="formData.propertyPrice" type="number" required class="w-full rounded-md border border-gray-300 bg-transparent p-2 dark:border-gray-700" placeholder="Dene: -5000" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Komisyon (%) (Yüksek Sayı Test Edin)</label>
            <input v-model="formData.commissionRate" type="number" step="0.1" required class="w-full rounded-md border border-gray-300 bg-transparent p-2 dark:border-gray-700" placeholder="Dene: 200" />
          </div>
          <div class="col-span-1 md:col-span-2 pt-2">
            <BaseButton type="submit" variant="primary" :loading="isFetching" class="w-full">
              Sisteme Kaydet
            </BaseButton>
          </div>
        </form>
      </div>

      <!-- İşlemler Listesi -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-if="transactions.length === 0" class="col-span-2 text-center text-gray-500 p-8">
          Sistemde hiçbir kayıtlı operasyon bulunmuyor.
        </div>

        <div 
          v-for="item in transactions" 
          :key="item._id"
          class="relative overflow-hidden rounded-2xl border border-white/50 bg-surface/60 p-6 shadow-xl shadow-gray-200/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/60 dark:shadow-gray-900/50"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold tracking-tight text-text">{{ item.propertyTitle }}</h2>
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
              <span>Komisyon Oranı:</span> <span class="font-semibold text-text">%{{ item.commissionRate }}</span>
            </p>
          </div>

          <div class="flex items-center gap-3 border-t border-gray-200/50 dark:border-gray-700/50 pt-5">
            <BaseButton 
              v-if="item.status !== TransactionStatus.COMPLETED && item.status !== TransactionStatus.CANCELLED"
              variant="primary" 
              :loading="isFetching" 
              @click="advanceStatus(item)"
              class="w-full"
            >
              [{{ getNextStepName(item.status) }}] Statüsüne Ulaştır 
            </BaseButton>

            <BaseButton 
              v-else
              variant="outline" 
              disabled
              class="w-full"
            >
              Süreç İlerletilemez (Komisyon Aşamasında)
            </BaseButton>
          </div>
        </div>

      </div>

    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTransactions } from '@/composables/useTransactions';
import { TransactionStatus } from '@repo/types';

const isFormOpen = ref(false);
const formData = ref({
  propertyTitle: '',
  agentName: '',
  propertyPrice: null,
  commissionRate: null
});

// Composable (Backend haberleşmesi)
const { transactions, isFetching, error, fetchAll, createTransaction, updateStatus } = useTransactions();

onMounted(() => {
  fetchAll();
});

// Kayıt İşlemi Ekle
const submitForm = async () => {
  const isSuccess = await createTransaction({
    propertyTitle: formData.value.propertyTitle,
    agentName: formData.value.agentName,
    propertyPrice: Number(formData.value.propertyPrice),
    commissionRate: Number(formData.value.commissionRate)
  });
  
  // Hata olmadan backendden dönerse formu kapat
  if (isSuccess) {
    formData.value = { propertyTitle: '', agentName: '', propertyPrice: null, commissionRate: null };
    isFormOpen.value = false;
  }
}

// TL Çevirici
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
}

// Durum Motoru Aşaması
const getNextStepName = (currentStatus: TransactionStatus) => {
  const stepNames: Record<string, string> = {
    [TransactionStatus.AGREEMENT]: 'Kapora Al',
    [TransactionStatus.EARNEST_MONEY]: 'Tapu Devrine Geç',
    [TransactionStatus.TITLE_DEED]: 'İşlemi Tamamla'
  };
  return stepNames[currentStatus] || '';
}

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

// Tema
const colorMode = useColorMode();
const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>
