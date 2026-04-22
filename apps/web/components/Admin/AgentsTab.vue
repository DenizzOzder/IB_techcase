<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h2 class="text-xl font-bold text-text">Sistem Danışmanları (Agents)</h2>
      <BaseButton variant="primary" @click="showAddModal = true" class="shadow-lg shadow-primary-500/20">
        + Yeni Danışman Ekle
      </BaseButton>
    </div>

    <div v-if="isFetching && !agents.length" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <div v-else-if="!agents.length" class="text-center py-12 text-gray-500">
      Sistemde kayıtlı danışman bulunmuyor.
    </div>

    <!-- Agent Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="agent in agents" 
        :key="agent._id"
        class="group relative overflow-hidden rounded-2xl border bg-surface/60 p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-gray-800/60"
        :class="agent.isActive ? 'border-white/50 dark:border-gray-700/50' : 'border-red-500/30 opacity-70'"
      >
        <div class="absolute right-4 top-4">
          <span 
            class="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
            :class="agent.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
          >
            {{ agent.isActive ? 'Aktif' : 'Pasif' }}
          </span>
        </div>

        <div class="flex items-center gap-4 mb-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-purple-600 text-lg font-bold text-white shadow-lg shadow-primary-500/30">
            {{ agent.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="text-lg font-bold text-text">{{ agent.name }}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ agent.email }}</p>
          </div>
        </div>

        <div class="mt-6 flex gap-2">
          <BaseButton variant="outline" class="flex-1 py-2 text-xs" @click="$emit('view-profile', agent._id)">
            Profili İncele
          </BaseButton>
          <button 
            v-if="agent.isActive"
            @click="confirmDeactivate(agent)"
            class="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-red-500 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10 dark:hover:bg-red-900/30"
            title="Pasife Al"
          >
            <span class="text-sm">🗑️</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Yeni Agent Modalı -->
    <Transition name="fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div class="w-full max-w-md rounded-[2rem] bg-surface p-8 shadow-2xl dark:bg-gray-900 border border-white/10">
          <h3 class="text-xl font-bold mb-6 text-text">Yeni Danışman Ekle</h3>
          
          <form @submit.prevent="submitAddAgent">
            <div class="space-y-4 mb-8">
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Ad Soyad</label>
                <input v-model="formData.name" type="text" required class="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:bg-gray-900/50 dark:border-gray-700" placeholder="Örn: Ahmet Yılmaz" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">E-Posta (Giriş için)</label>
                <input v-model="formData.email" type="email" required class="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:bg-gray-900/50 dark:border-gray-700" placeholder="ahmet@bmakas.com" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Şifre</label>
                <input v-model="formData.password" type="password" required class="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:bg-gray-900/50 dark:border-gray-700" placeholder="En az 6 karakter" />
              </div>
            </div>
            
            <div class="flex gap-3">
              <BaseButton type="button" variant="ghost" @click="showAddModal = false" class="flex-1">İptal</BaseButton>
              <BaseButton type="submit" variant="primary" :loading="isFetching" class="flex-1">Kaydet</BaseButton>
            </div>
          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IAgentResponse } from '@repo/types';

const props = defineProps<{
  agents: IAgentResponse[];
  isFetching: boolean;
}>();

const emit = defineEmits<{
  (e: 'view-profile', id: string): void;
  (e: 'add-agent', data: { name: string; email: string; password?: string }): void;
  (e: 'deactivate', id: string): void;
}>();

const showAddModal = ref(false);
const formData = ref({ name: '', email: '', password: '' });

const submitAddAgent = () => {
  emit('add-agent', { ...formData.value });
  formData.value = { name: '', email: '', password: '' };
  showAddModal.value = false;
};

const confirmDeactivate = (agent: IAgentResponse) => {
  if (confirm(`${agent.name} isimli danışmanı pasife almak istediğinize emin misiniz?`)) {
    emit('deactivate', agent._id);
  }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
