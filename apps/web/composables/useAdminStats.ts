import { ref } from 'vue';
import { IStatsResponse } from '@repo/types';
import { $fetch } from 'ofetch';
import { useAuthStore } from '@/stores/authStore';

export const useAdminStats = () => {
  const config = useRuntimeConfig();
  const API = config.public.apiBaseUrl;
  const stats = ref<IStatsResponse | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchStats = async (period: 'monthly' | 'yearly' = 'monthly') => {
    const authStore = useAuthStore();
    isLoading.value = true;
    error.value = null;

    try {
      const res = await $fetch<{ data: IStatsResponse }>(`${API}/admin/stats`, {
        params: { period },
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        credentials: 'include',
      });
      stats.value = res.data;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
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
