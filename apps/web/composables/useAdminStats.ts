import { ref } from 'vue';
import { IStatsResponse } from '@repo/types';
import { $fetch } from 'ofetch';
import { useAuthStore } from '@/stores/authStore';

const API = 'http://localhost:3001';

export const useAdminStats = () => {
  const stats = ref<IStatsResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchStats = async (period: 'monthly' | 'yearly' = 'monthly') => {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;

    try {
      const res = await $fetch<IStatsResponse>(`${API}/admin/stats`, {
        params: { period },
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        credentials: 'include',
      });
      stats.value = res;
    } catch (e: any) {
      error.value = e.data?.message || 'İstatistikler yüklenemedi.';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};
