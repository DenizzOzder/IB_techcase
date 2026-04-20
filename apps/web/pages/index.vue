<template>
  <main class="min-h-screen pt-12 pb-24 px-6 md:px-12 relative overflow-hidden">
    <!-- Dekoratif Etkiler -->
    <div class="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[100px]"></div>
    <div class="pointer-events-none absolute top-40 -right-20 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]"></div>
    
    <div class="mx-auto max-w-5xl relative z-10">
      
      <!-- KULLANICI DOSTU HATA UYARISI -->
      <div 
        v-if="error" 
        class="mb-6 flex items-start gap-3 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 shadow-md dark:bg-red-950/40"
      >
        <div class="text-2xl">⚠️</div>
        <div class="flex-1">
          <p class="font-semibold text-red-800 dark:text-red-300">İşlem Tamamlanamadı</p>
          <p class="mt-1 text-sm text-red-700 dark:text-red-400">{{ error }}</p>
        </div>
        <button @click="clearError" class="text-red-400 hover:text-red-600 transition-colors text-lg">✕</button>
      </div>

      <!-- Başlık ve Kontroller -->
      <header class="mb-10 flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-text to-gray-500 bg-clip-text text-transparent dark:to-gray-400">
            Emlak Operasyon Paneli
          </h1>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Aktif emlak işlemlerinizi buradan yönetin.
          </p>
          <div class="mt-4">
            <BaseButton variant="outline" @click="isFormOpen = !isFormOpen">
              {{ isFormOpen ? '✕ Kapat' : '+ Yeni İşlem Ekle' }}
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

      <!-- YENİ İŞLEM FORMU -->
      <div v-show="isFormOpen" class="mb-8 overflow-hidden rounded-2xl border border-white/30 bg-surface/80 p-6 shadow-xl backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80">
        <h2 class="text-xl font-bold mb-4">Yeni Emlak İşlemi</h2>
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
            <label class="block text-sm font-medium mb-1">Satış Tutarı (₺)</label>
            <input v-model="formData.propertyPrice" type="number" required class="w-full rounded-md border border-gray-300 bg-transparent p-2 dark:border-gray-700" placeholder="Örn: 5000000" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Komisyon Oranı (%)</label>
            <input v-model="formData.commissionRate" type="number" step="0.1" required class="w-full rounded-md border border-gray-300 bg-transparent p-2 dark:border-gray-700" placeholder="Örn: 2.5" />
          </div>
          <div class="col-span-1 md:col-span-2 pt-2">
            <BaseButton type="submit" variant="primary" :loading="isFetching" class="w-full">
              Kaydet
            </BaseButton>
          </div>
        </form>
      </div>

      <!-- İşlemler Listesi -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-if="transactions.length === 0" class="col-span-2 text-center text-gray-500 p-8">
          Henüz kayıtlı bir emlak işlemi bulunmuyor.
        </div>

        <div 
          v-for="item in transactions" 
          :key="item._id"
          :class="[
            'relative overflow-hidden rounded-2xl border p-6 shadow-xl backdrop-blur-xl transition-all duration-500',
            item.status === TransactionStatus.CANCELLED
              ? 'border-red-200/50 bg-red-50/60 dark:border-red-900/30 dark:bg-red-950/20 opacity-70'
              : 'border-white/50 bg-surface/60 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/60'
          ]"
        >
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold tracking-tight text-text">{{ item.propertyTitle }}</h2>
            <StatusBadge :status="item.status" />
          </div>

          <div class="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300">
            <p class="flex justify-between items-center rounded-lg bg-gray-50/50 p-2 dark:bg-gray-900/30">
              <span>Danışman</span> <span class="font-semibold text-text">{{ item.agentName }}</span>
            </p>
            <p class="flex justify-between items-center rounded-lg bg-gray-50/50 p-2 dark:bg-gray-900/30">
              <span>Satış Tutarı</span> <span class="font-semibold text-text">{{ formatCurrency(item.propertyPrice) }}</span>
            </p>
            <p class="flex justify-between items-center rounded-lg bg-gray-50/50 p-2 dark:bg-gray-900/30">
              <span>Komisyon</span> <span class="font-semibold text-text">%{{ item.commissionRate }}</span>
            </p>
          </div>

          <!-- AKSİYON BUTONLARI -->
          <div class="border-t border-gray-200/50 dark:border-gray-700/50 pt-4 space-y-2">

            <!-- Tamamlanmış -->
            <div v-if="item.status === TransactionStatus.COMPLETED" class="text-center text-sm text-success font-semibold py-2">
              ✓ İşlem başarıyla tamamlandı, komisyon aktarıldı.
            </div>

            <!-- İptal edilmiş -->
            <div v-else-if="item.status === TransactionStatus.CANCELLED" class="text-center text-sm text-danger font-semibold py-2">
              ✕ Bu işlem iptal edilmiş.
            </div>

            <!-- Aktif işlem kontrolleri -->
            <template v-else>
              <!-- İlerle butonu -->
              <BaseButton 
                variant="primary" 
                :loading="isFetching" 
                @click="advanceStatus(item)"
                class="w-full"
              >
                {{ getNextStepName(item.status) }} →
              </BaseButton>

              <!-- Geri Al ve İptal Et yan yana -->
              <div class="flex gap-2">
                <BaseButton 
                  v-if="canRollback(item.status)"
                  variant="outline" 
                  :loading="isFetching" 
                  @click="confirmRollback(item)"
                  class="flex-1 text-xs"
                >
                  ← Önceki Aşamaya Dön
                </BaseButton>

                <BaseButton 
                  variant="ghost" 
                  :loading="isFetching" 
                  @click="confirmCancel(item)"
                  class="flex-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400"
                >
                  ✕ İşlemi İptal Et
                </BaseButton>
              </div>
            </template>

          </div>
        </div>

      </div>

    </div>

    <!-- ONAY MODALI (İptal / Geri Al) -->
    <div v-if="confirmModal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="mx-4 w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl dark:bg-gray-800">
        <h3 class="text-lg font-bold mb-2">{{ confirmModal.title }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">{{ confirmModal.message }}</p>
        <div class="flex gap-3">
          <BaseButton variant="outline" @click="confirmModal.show = false" class="flex-1">
            Vazgeç
          </BaseButton>
          <BaseButton 
            variant="primary" 
            :loading="isFetching" 
            @click="confirmModal.onConfirm()"
            class="flex-1 bg-red-500 hover:bg-red-600"
          >
            Evet, devam et
          </BaseButton>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTransactions } from '@/composables/useTransactions';
import { TransactionStatus, ITransaction } from '@repo/types';

const isFormOpen = ref(false);
const formData = ref({
  propertyTitle: '',
  agentName: '',
  propertyPrice: null as number | null,
  commissionRate: null as number | null
});

const confirmModal = ref({
  show: false,
  title: '',
  message: '',
  onConfirm: () => {}
});

const { transactions, isFetching, error, fetchAll, createTransaction, updateStatus, cancelTransaction, rollbackTransaction } = useTransactions();

const clearError = () => { error.value = null; };

onMounted(() => { fetchAll(); });

const submitForm = async () => {
  const isSuccess = await createTransaction({
    propertyTitle: formData.value.propertyTitle,
    agentName: formData.value.agentName,
    propertyPrice: Number(formData.value.propertyPrice),
    commissionRate: Number(formData.value.commissionRate)
  });
  if (isSuccess) {
    formData.value = { propertyTitle: '', agentName: '', propertyPrice: null, commissionRate: null };
    isFormOpen.value = false;
  }
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

const getNextStepName = (currentStatus: TransactionStatus) => {
  const stepNames: Record<string, string> = {
    [TransactionStatus.AGREEMENT]: 'Kapora Alındı Olarak İşaretle',
    [TransactionStatus.EARNEST_MONEY]: 'Tapu Devir Sürecine Geç',
    [TransactionStatus.TITLE_DEED]: 'İşlemi Tamamla ve Komisyonu Aktar'
  };
  return stepNames[currentStatus] || '';
};

const canRollback = (status: TransactionStatus) =>
  status !== TransactionStatus.AGREEMENT && status !== TransactionStatus.CANCELLED;

const advanceStatus = async (item: ITransaction) => {
  const steps = [
    TransactionStatus.AGREEMENT,
    TransactionStatus.EARNEST_MONEY,
    TransactionStatus.TITLE_DEED,
    TransactionStatus.COMPLETED
  ];
  const currentIndex = steps.indexOf(item.status);
  if (currentIndex < steps.length - 1) {
    await updateStatus(item._id!, steps[currentIndex + 1]);
  }
};

const confirmCancel = (item: ITransaction) => {
  confirmModal.value = {
    show: true,
    title: 'İşlemi İptal Et',
    message: `"${item.propertyTitle}" için açılan işlemi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
    onConfirm: async () => {
      confirmModal.value.show = false;
      await cancelTransaction(item._id!);
    }
  };
};

const confirmRollback = (item: ITransaction) => {
  confirmModal.value = {
    show: true,
    title: 'Önceki Aşamaya Dön',
    message: `"${item.propertyTitle}" işlemini bir önceki aşamaya geri almak istediğinizden emin misiniz?`,
    onConfirm: async () => {
      confirmModal.value.show = false;
      await rollbackTransaction(item._id!);
    }
  };
};

const colorMode = useColorMode();
const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};
</script>
