import { ref } from 'vue';
import { IAgentResponse, IAgentDetailResponse } from '@repo/types';
import { useAuthStore } from '@/stores/authStore';

export function useAgents() {
  const config = useRuntimeConfig();
  const API = config.public.apiBaseUrl;
  const authStore = useAuthStore();
  const agents = ref<IAgentResponse[]>([]);
  const selectedAgent = ref<IAgentDetailResponse | null>(null);
  const isFetching = ref(false);
  const error = ref<string | null>(null);

  const fetchAgents = async () => {
    isFetching.value = true;
    error.value = null;
    try {
      const response = await $fetch<{ data: IAgentResponse[] }>(`${API}/users/agents`, {
        headers: { Authorization: `Bearer ${authStore.accessToken}` }
      });
      agents.value = response.data;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = e.data?.message || 'Danışmanlar yüklenirken bir hata oluştu.';
    } finally {
      isFetching.value = false;
    }
  };

  const createAgent = async (data: { name: string; email: string; password?: string }) => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/users/agent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
        body: data,
      });
      await fetchAgents();
      return true;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = e.data?.message || 'Danışman oluşturulamadı.';
      return false;
    } finally {
      isFetching.value = false;
    }
  };

  const deactivateAgent = async (id: string) => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/users/agents/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authStore.accessToken}` }
      });
      await fetchAgents();
      return true;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = e.data?.message || 'Danışman pasife alınamadı.';
      return false;
    } finally {
      isFetching.value = false;
    }
  };

  const fetchAgentStats = async (id: string) => {
    isFetching.value = true;
    error.value = null;
    try {
      const response = await $fetch<{ data: IAgentDetailResponse }>(`${API}/users/agents/${id}/stats`, {
        headers: { Authorization: `Bearer ${authStore.accessToken}` }
      });
      selectedAgent.value = response.data;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = e.data?.message || 'Danışman detayları yüklenemedi.';
    } finally {
      isFetching.value = false;
    }
  };

  const fetchMyStats = async () => {
    isFetching.value = true;
    error.value = null;
    try {
      const response = await $fetch<{ data: IAgentStats }>(`${API}/users/me/stats`, {
        headers: { Authorization: `Bearer ${authStore.accessToken}` }
      });
      return response.data;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = e.data?.message || 'İstatistikleriniz yüklenemedi.';
      return null;
    } finally {
      isFetching.value = false;
    }
  };

  return {
    agents,
    selectedAgent,
    isFetching,
    error,
    fetchAgents,
    createAgent,
    deactivateAgent,
    fetchAgentStats,
    fetchMyStats,
  };
}
