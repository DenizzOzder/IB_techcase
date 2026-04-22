import { ref } from 'vue';
import { IAuditLogsResponse } from '@repo/types';
import { useAuthStore } from '@/stores/authStore';

const API = 'http://localhost:3001';

export function useLogs() {
  const authStore = useAuthStore();
  const logsData = ref<IAuditLogsResponse | null>(null);
  const isFetching = ref(false);
  const error = ref<string | null>(null);

  const fetchLogs = async (page: number = 1, limit: number = 20) => {
    isFetching.value = true;
    error.value = null;
    try {
      const response = await $fetch<IAuditLogsResponse>(`${API}/logs?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${authStore.accessToken}` }
      });
      logsData.value = response;
    } catch (e: any) {
      error.value = e.data?.message || 'Loglar yüklenirken bir hata oluştu.';
    } finally {
      isFetching.value = false;
    }
  };

  return {
    logsData,
    isFetching,
    error,
    fetchLogs,
  };
}
