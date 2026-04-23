import { ref } from 'vue';
import { IAuditLogsResponse } from '@repo/types';
import { useAuthStore } from '@/stores/authStore';

const API = 'http://localhost:3001';

export function useLogs() {
  const authStore = useAuthStore();
  const logsData = ref<IAuditLogsResponse | null>(null);
  const isFetching = ref(false);
  const error = ref<string | null>(null);

  const fetchLogs = async (page: number = 1, limit: number = 20, timeRange?: string) => {
    isFetching.value = true;
    error.value = null;
    try {
      const timeQuery = timeRange ? `&timeRange=${timeRange}` : '';
      const response = await $fetch<{ data: IAuditLogsResponse }>(`${API}/logs?page=${page}&limit=${limit}${timeQuery}`, {
        headers: { Authorization: `Bearer ${authStore.accessToken}` }
      });
      logsData.value = response.data;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
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
