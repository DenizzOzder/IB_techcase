<template>
  <main class="min-h-screen flex bg-background overflow-hidden relative">
    
    <!-- ADMIN SIDEBAR (Yalnızca Admin ise) -->
    <AdminSidebar v-if="authStore.isAdmin" />

    <!-- ANA İÇERİK ALANI -->
    <div 
      class="flex-1 relative overflow-y-auto pt-12 pb-24 px-6 md:px-12 transition-all duration-500 ease-in-out"
      :class="[authStore.isAdmin ? 'ml-0 md:ml-80' : '']"
    >
      <!-- Dekoratif Arka Plan -->
      <div class="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[100px]"></div>
      <div class="pointer-events-none absolute top-40 -right-20 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-[100px]"></div>
      
      <div class="mx-auto max-w-5xl relative z-10">
        
        <!-- Hata Mesajı -->
        <Transition name="fade">
          <div v-if="error || agentsError || logsError" class="mb-6 flex items-start gap-3 rounded-xl border-l-4 border-danger bg-red-50 p-4 shadow-md dark:bg-red-950/40">
            <div class="text-2xl">⚠️</div>
            <div class="flex-1">
              <p class="font-semibold text-red-800 dark:text-red-300">Hata Oluştu</p>
              <p class="mt-1 text-sm text-red-700 dark:text-red-400">{{ error || agentsError || logsError }}</p>
            </div>
            <button @click="clearErrors" class="text-red-400 hover:text-red-600 transition-colors text-lg">✕</button>
          </div>
        </Transition>

        <!-- Başlık ve Kontroller -->
        <header class="mb-10 flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-text to-gray-500 bg-clip-text text-transparent dark:to-gray-400">
              {{ authStore.isAdmin ? 'Yönetici Dashboard' : 'Danışman Paneli' }}
            </h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-lg">
              {{ authStore.isAdmin 
                ? 'Şirket genelindeki tüm operasyonları ve performans istatistiklerini buradan takip edin.' 
                : 'Aktif emlak işlemlerinizi, komisyon süreçlerini ve tapu aşamalarını yönetin.' 
              }}
            </p>
            <div v-if="!authStore.isAdmin" class="mt-6">
              <BaseButton variant="primary" @click="isFormOpen = !isFormOpen" class="shadow-lg shadow-primary-500/20">
                {{ isFormOpen ? '✕ Formu Kapat' : '+ Yeni İşlem Kaydı' }}
              </BaseButton>
            </div>
          </div>
          
          <!-- Sağ Üst: Tema & Çıkış -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 rounded-full px-4 py-2 bg-surface/40 border border-white/20 backdrop-blur-md shadow-sm">
              <span class="text-sm font-semibold text-text">{{ authStore.displayName }}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" 
                    :class="authStore.isAdmin ? 'bg-purple-500/20 text-purple-600' : 'bg-blue-500/20 text-blue-600'">
                {{ authStore.isAdmin ? 'Admin' : 'Agent' }}
              </span>
            </div>
            <button @click="toggleTheme" class="rounded-full p-2.5 bg-surface/40 border border-white/20 text-text hover:scale-105 transition-transform">
              {{ $colorMode.value === 'dark' ? '☀️' : '🌙' }}
            </button>
            <button @click="handleLogout" class="rounded-full p-2.5 bg-surface/40 border border-white/20 text-danger hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
              🚪
            </button>
          </div>
        </header>

        <!-- YENİ İŞLEM FORMU (Sadece Agent) -->
        <Transition name="slide">
          <div v-if="!authStore.isAdmin && isFormOpen" class="mb-10 overflow-hidden rounded-3xl border border-white/30 bg-surface/80 p-8 shadow-2xl backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80">
            <h2 class="text-2xl font-bold mb-6 text-text">Mülk Kayıt Formu</h2>
            <form @submit.prevent="submitForm" class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-1">
                <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Mülk Adı / Başlık</label>
                <input v-model="formData.propertyTitle" type="text" required class="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:bg-gray-900/50 dark:border-gray-700" placeholder="Örn: Nişantaşı Residence" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Satış Tutarı (₺)</label>
                <input v-model="formData.propertyPrice" type="number" required class="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:bg-gray-900/50 dark:border-gray-700" placeholder="0.00" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Komisyon Oranı (%)</label>
                <input v-model="formData.commissionRate" type="number" step="0.1" required class="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:bg-gray-900/50 dark:border-gray-700" placeholder="2.0" />
              </div>
              <div class="md:col-span-3 pt-2">
                <BaseButton type="submit" variant="primary" :loading="isFetchingTx" class="w-full py-4 text-base">
                  İşlemi Başlat
                </BaseButton>
              </div>
            </form>
          </div>
        </Transition>

        <!-- ADMIN TAB NAVİGASYON -->
        <div v-if="authStore.isAdmin" class="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800 pb-px">
          <button 
            @click="activeTab = 'transactions'"
            class="px-4 py-2 font-semibold text-sm transition-all border-b-2"
            :class="activeTab === 'transactions' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-text'"
          >
            🏡 İlanlar & İşlemler
          </button>
          <button 
            @click="activeTab = 'agents'"
            class="px-4 py-2 font-semibold text-sm transition-all border-b-2"
            :class="activeTab === 'agents' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-text'"
          >
            👥 Danışmanlar
          </button>
          <button 
            @click="activeTab = 'logs'"
            class="px-4 py-2 font-semibold text-sm transition-all border-b-2"
            :class="activeTab === 'logs' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-text'"
          >
            📜 İşlem Logları
          </button>
        </div>

        <!-- İÇERİK: TABS -->
        
        <!-- Tab: İlanlar (Agent'lar için her zaman aktif) -->
        <AdminTransactionsTab 
          v-if="!authStore.isAdmin || activeTab === 'transactions'"
          :transactions="transactions"
          :is-fetching="isFetchingTx"
          @advance="advanceStatus"
          @cancel="confirmCancel"
          @rollback="confirmRollback"
        />

        <!-- Tab: Danışmanlar -->
        <AdminAgentsTab 
          v-if="authStore.isAdmin && activeTab === 'agents'"
          :agents="agents"
          :is-fetching="isFetchingAgents"
          @add-agent="handleAddAgent"
          @deactivate="handleDeactivateAgent"
          @view-profile="openAgentProfile"
        />

        <!-- Tab: Loglar -->
        <AdminLogsTab 
          v-if="authStore.isAdmin && activeTab === 'logs'"
        />

      </div>
    </div>

    <!-- ONAY MODALI (Transaction İptal/Geri Al) -->
    <Transition name="fade">
      <div v-if="confirmModal.show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div class="w-full max-w-sm rounded-[2rem] bg-surface p-8 shadow-2xl dark:bg-gray-900 border border-white/10">
          <div class="w-16 h-16 rounded-2xl bg-danger/10 text-danger flex items-center justify-center text-3xl mb-6 mx-auto">⚠️</div>
          <h3 class="text-xl font-bold mb-3 text-center text-text">{{ confirmModal.title }}</h3>
          <p class="text-sm text-gray-500 text-center mb-8 leading-relaxed">{{ confirmModal.message }}</p>
          <div class="flex flex-col gap-3">
            <BaseButton variant="primary" @click="confirmModal.onConfirm" class="bg-danger hover:bg-red-600 py-3">Evet, Onaylıyorum</BaseButton>
            <BaseButton variant="ghost" @click="confirmModal.show = false">Vazgeç</BaseButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- AGENT PROFILE SLIDEOVER -->
    <AdminAgentProfileSlideover 
      :is-open="isProfileOpen"
      :agent="selectedAgent"
      :is-fetching="isFetchingAgents"
      @close="isProfileOpen = false"
    />

  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useTransactions } from '@/composables/useTransactions';
import { useAgents } from '@/composables/useAgents';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/composables/useAuth';
import { TransactionStatus, ITransaction } from '@repo/types';

definePageMeta({ middleware: 'auth' });

const authStore = useAuthStore();
const { logout } = useAuth();
const colorMode = useColorMode();

const { 
  transactions, 
  isFetching: isFetchingTx, 
  error, 
  fetchAll, 
  createTransaction, 
  updateStatus, 
  cancelTransaction, 
  rollbackTransaction 
} = useTransactions();

const {
  agents,
  selectedAgent,
  isFetching: isFetchingAgents,
  error: agentsError,
  fetchAgents,
  createAgent,
  deactivateAgent,
  fetchAgentStats
} = useAgents();

// Tab state
const activeTab = ref<'transactions' | 'agents' | 'logs'>('transactions');
const isProfileOpen = ref(false);

const isFormOpen = ref(false);
const formData = ref({ propertyTitle: '', propertyPrice: null as number | null, commissionRate: null as number | null });
const confirmModal = ref({ show: false, title: '', message: '', onConfirm: () => {} });

const clearErrors = () => {
  error.value = null;
  agentsError.value = null;
};

// Initial load
onMounted(() => {
  fetchAll();
  if (authStore.isAdmin) {
    fetchAgents();
  }
});

// Watch tab changes to lazy load data if needed
watch(activeTab, (newTab) => {
  if (newTab === 'agents' && agents.value.length === 0) {
    fetchAgents();
  }
});

// --- Transactions Logic ---
const submitForm = async () => {
  const ok = await createTransaction({
    propertyTitle: formData.value.propertyTitle,
    propertyPrice: Number(formData.value.propertyPrice),
    commissionRate: Number(formData.value.commissionRate)
  });
  if (ok) {
    formData.value = { propertyTitle: '', propertyPrice: null, commissionRate: null };
    isFormOpen.value = false;
  }
};

const advanceStatus = async (item: ITransaction) => {
  const steps = [TransactionStatus.AGREEMENT, TransactionStatus.EARNEST_MONEY, TransactionStatus.TITLE_DEED, TransactionStatus.COMPLETED];
  const idx = steps.indexOf(item.status);
  if (idx < steps.length - 1) await updateStatus(item._id!, steps[idx + 1]);
};

const confirmCancel = (item: ITransaction) => {
  confirmModal.value = {
    show: true,
    title: 'İşlemi İptal Et',
    message: `"${item.propertyTitle}" kaydını iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
    onConfirm: async () => { confirmModal.value.show = false; await cancelTransaction(item._id!); }
  };
};

const confirmRollback = (item: ITransaction) => {
  confirmModal.value = {
    show: true,
    title: 'Geri Al',
    message: `"${item.propertyTitle}" işlemini bir önceki aşamaya döndürmek istiyor musunuz?`,
    onConfirm: async () => { confirmModal.value.show = false; await rollbackTransaction(item._id!); }
  };
};

// --- Agents Logic ---
const handleAddAgent = async (data: any) => {
  await createAgent(data);
};

const handleDeactivateAgent = async (id: string) => {
  await deactivateAgent(id);
};

const openAgentProfile = async (id: string) => {
  isProfileOpen.value = true;
  await fetchAgentStats(id);
};

const handleLogout = () => logout();
const toggleTheme = () => colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active, .slide-leave-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); max-height: 500px; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; transform: translateY(-20px); }
</style>

