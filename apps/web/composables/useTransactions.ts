import { ref } from 'vue';
import { ITransaction, TransactionStatus, ICreateTransactionRequest } from '@repo/types';
import { $fetch } from 'ofetch'; // IDE Auto-import uyarısını çözmek için explicit import

export const useTransactions = () => {
  const isFetching = ref(false);
  const error = ref<string | null>(null);
  const transactions = ref<ITransaction[]>([]);

  // 1. Tüm Emlak İşlemlerini Backend'den Çek (HTTP GET)
  const fetchAll = async () => {
    isFetching.value = true;
    error.value = null;
    try {
      const res = await $fetch<ITransaction[]>('http://localhost:3001/transactions');
      transactions.value = res;
    } catch (e: any) {
      error.value = e.data?.message?.toString() || e.message || 'Sunucuyla bağlantı kurulamadı.';
    } finally {
      isFetching.value = false;
    }
  };

  // 2. Yeni Emlak Kaydı (HTTP POST) - Validation Testlerini Test Eder
  const createTransaction = async (payload: ICreateTransactionRequest) => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch('http://localhost:3001/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      // Hata barını sil ve Data listesini güncelle
      error.value = null;
      await fetchAll();
      return true; 
    } catch (e: any) {
      // NestJS Class-Validator Hata Ayıklayıcısı
      // Array gelirse virgülle ayır, stringse direkt bas.
      error.value = Array.isArray(e.data?.message) 
        ? e.data.message.join(' | ') 
        : (e.data?.message || 'Kayıt sırasında bilinmeyen hata.');
      return false; 
    } finally {
      isFetching.value = false;
    }
  };

  // 3. Tapu State'ini İlerletme (HTTP PATCH) -> Completed olursa Komisyon tetiklenir
  const updateStatus = async (id: string, newStatus: TransactionStatus) => {
    isFetching.value = true;
    error.value = null;
    try {
      await $fetch(`http://localhost:3001/transactions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: { status: newStatus }
      });
      error.value = null;
      await fetchAll();
    } catch (e: any) {
      error.value = Array.isArray(e.data?.message) 
        ? e.data.message.join(' | ') 
        : (e.data?.message || 'Tapu statüsü güncellenemedi.');
    } finally {
      isFetching.value = false;
    }
  };

  return {
    transactions,
    isFetching,
    error,
    fetchAll,
    createTransaction,
    updateStatus
  }
}
