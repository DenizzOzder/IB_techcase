import { ref } from 'vue';
import { ITransaction, TransactionStatus, ICreateTransactionRequest } from '@repo/types';
import { $fetch } from 'ofetch';
import { useAuthStore } from '@/stores/authStore';

/**
 * Tüm API isteklerine Authorization header ve credentials eklenir.
 * - Authorization: Bearer <accessToken> → JWT korumalı endpoint'ler için
 * - credentials: 'include' → httpOnly cookie otomatik gönderilir
 */
export const useTransactions = () => {
  const config = useRuntimeConfig();
  const API = config.public.apiBaseUrl;
  const isFetching = ref(false);
  const error = ref<string | null>(null);
  const transactions = ref<ITransaction[]>([]);
  const hasMore = ref(true);
  const currentPage = ref(1);

  const getHeaders = () => {
    const authStore = useAuthStore();
    return {
      'Content-Type': 'application/json',
      ...(authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {}),
    };
  };

  // 1. Emlak İşlemlerini Çek — Rol bazlı filtreleme backend'de yapılır
  const fetchAll = async (page: number = 1, limit: number = 20, loadMore: boolean = false, listType: 'my' | 'company' | 'all' = 'all') => {
    isFetching.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: ITransaction[] }>(`${API}/transactions`, {
        query: { page, limit, type: listType },
        credentials: 'include',
        headers: getHeaders(),
      });
      
      if (loadMore) {
        transactions.value = [...transactions.value, ...res.data];
      } else {
        transactions.value = res.data;
      }
      
      currentPage.value = page;
      hasMore.value = res.data.length === limit;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = e.data?.message?.toString() || e.message || 'Sunucuyla bağlantı kurulamadı.';
    } finally {
      isFetching.value = false;
    }
  };

  // 2. Yeni Emlak Kaydı — agentId backend tarafında JWT'den alınır
  const createTransaction = async (payload: ICreateTransactionRequest) => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/transactions`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: payload,
      });
      error.value = null;
      await fetchAll();
      return true;
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = Array.isArray(e.data?.message)
        ? e.data.message.join(' | ')
        : (e.data?.message || 'Kayıt sırasında bilinmeyen hata.');
      return false;
    } finally {
      isFetching.value = false;
    }
  };

  // 3. Statü İlerletme
  const updateStatus = async (id: string, newStatus: TransactionStatus) => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/transactions/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: { status: newStatus },
      });
      error.value = null;
      await fetchAll();
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = Array.isArray(e.data?.message)
        ? e.data.message.join(' | ')
        : (e.data?.message || 'Tapu statüsü güncellenemedi.');
    } finally {
      isFetching.value = false;
    }
  };

  const cancelTransaction = async (id: string) => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/transactions/${id}/cancel`, {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
      });
      error.value = null;
      await fetchAll();
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = Array.isArray(e.data?.message)
        ? e.data.message.join(' | ')
        : (e.data?.message || 'İptal işlemi sırasında bir hata oluştu.');
    } finally {
      isFetching.value = false;
    }
  };

  const rollbackTransaction = async (id: string) => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/transactions/${id}/rollback`, {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
      });
      error.value = null;
      await fetchAll();
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = Array.isArray(e.data?.message)
        ? e.data.message.join(' | ')
        : (e.data?.message || 'Geri alma işlemi sırasında bir hata oluştu.');
    } finally {
      isFetching.value = false;
    }
  };

  const claimTransaction = async (id: string, listType: 'my' | 'company' | 'all' = 'all') => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/transactions/${id}/claim`, {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
      });
      error.value = null;
      await fetchAll(1, 20, false, listType);
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = Array.isArray(e.data?.message)
        ? e.data.message.join(' | ')
        : (e.data?.message || 'İlanı üzerinize alırken bir hata oluştu.');
    } finally {
      isFetching.value = false;
    }
  };

  const approveClaim = async (id: string, listType: 'my' | 'company' | 'all' = 'all') => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/transactions/${id}/approve-claim`, {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
      });
      error.value = null;
      await fetchAll(1, 20, false, listType);
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = Array.isArray(e.data?.message)
        ? e.data.message.join(' | ')
        : (e.data?.message || 'Talebi onaylarken bir hata oluştu.');
    } finally {
      isFetching.value = false;
    }
  };

  const rejectClaim = async (id: string, listType: 'my' | 'company' | 'all' = 'all') => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`${API}/transactions/${id}/reject-claim`, {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
      });
      error.value = null;
      await fetchAll(1, 20, false, listType);
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      error.value = Array.isArray(e.data?.message)
        ? e.data.message.join(' | ')
        : (e.data?.message || 'Talebi reddederken bir hata oluştu.');
    } finally {
      isFetching.value = false;
    }
  };

  return {
    transactions,
    isFetching,
    error,
    hasMore,
    currentPage,
    fetchAll,
    createTransaction,
    updateStatus,
    cancelTransaction,
    rollbackTransaction,
    claimTransaction,
    approveClaim,
    rejectClaim,
  };
};
