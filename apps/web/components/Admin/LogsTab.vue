<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-text">Sistem İşlem Logları</h2>
      <button @click="fetchLogs(1)" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        🔄
      </button>
    </div>

    <div v-if="isFetching && !logsData" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <div v-else-if="!logsData?.data.length" class="text-center py-12 text-gray-500">
      Henüz hiçbir işlem logu bulunmuyor.
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-gray-200 bg-surface dark:border-gray-800">
      <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
        <thead class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-4 font-bold">Zaman</th>
            <th scope="col" class="px-6 py-4 font-bold">Danışman</th>
            <th scope="col" class="px-6 py-4 font-bold">Mülk</th>
            <th scope="col" class="px-6 py-4 font-bold">İşlem</th>
            <th scope="col" class="px-6 py-4 font-bold">Durum Değişimi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logsData.data" :key="log._id" class="border-b border-gray-100 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30 transition-colors">
            <td class="whitespace-nowrap px-6 py-4 font-medium text-text">
              {{ formatDate(log.createdAt) }}
            </td>
            <td class="px-6 py-4 font-semibold text-text">
              {{ log.agentName }}
            </td>
            <td class="px-6 py-4 text-gray-600 dark:text-gray-300">
              {{ log.propertyTitle }}
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="getActionClass(log.action)">
                {{ log.action }}
              </span>
            </td>
            <td class="px-6 py-4 text-xs font-mono">
              <span v-if="log.previousStatus" class="text-gray-400">{{ log.previousStatus }} → </span>
              <span class="text-primary-600 dark:text-primary-400 font-bold">{{ log.newStatus }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="logsData.totalPages > 1" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-800 dark:bg-surface">
        <div class="flex flex-1 justify-between sm:hidden">
          <button @click="fetchLogs(logsData.page - 1)" :disabled="logsData.page === 1" class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Önceki</button>
          <button @click="fetchLogs(logsData.page + 1)" :disabled="logsData.page === logsData.totalPages" class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Sonraki</button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-400">
              Toplam <span class="font-medium">{{ logsData.total }}</span> kayıttan Sayfa <span class="font-medium">{{ logsData.page }} / {{ logsData.totalPages }}</span>
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button @click="fetchLogs(logsData.page - 1)" :disabled="logsData.page === 1" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                <span class="sr-only">Önceki</span>
                ◀
              </button>
              <button @click="fetchLogs(logsData.page + 1)" :disabled="logsData.page === logsData.totalPages" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                <span class="sr-only">Sonraki</span>
                ▶
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useLogs } from '@/composables/useLogs';
import { AuditLogAction } from '@repo/types';

const { logsData, isFetching, fetchLogs } = useLogs();

onMounted(() => {
  fetchLogs(1);
});

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const getActionClass = (action: AuditLogAction) => {
  switch (action) {
    case AuditLogAction.CREATED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case AuditLogAction.ADVANCED: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case AuditLogAction.ROLLED_BACK: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case AuditLogAction.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case AuditLogAction.COMPLETED: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};
</script>
