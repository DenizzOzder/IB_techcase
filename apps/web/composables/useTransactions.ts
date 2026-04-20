import { ref } from 'vue';
import { ITransaction, TransactionStatus } from '@repo/types';

// Vue Component'lerinde API izi bırakmamak için tekil Hook mimarisi
export const useTransactions = () => {
  const isFetching = ref(false);
  const error = ref<string | null>(null);

  // Frontend UI için statik "Mock" senaryosu (Backend entegrasyonu bitene dek)
  const transactions = ref<ITransaction[]>([
    {
      _id: '1',
      propertyTitle: 'Kadıköy Lüks Daire',
      propertyPrice: 5000000,
      agentName: 'Can Deniz',
      commissionRate: 2,
      status: TransactionStatus.AGREEMENT
    },
    {
      _id: '2',
      propertyTitle: 'Bodrum Yazlık Villa',
      propertyPrice: 15000000,
      agentName: 'Selin Yılmaz',
      commissionRate: 3,
      status: TransactionStatus.TITLE_DEED
    }
  ]);

  /**
   * Tapu durumunu bir üst kademeye çıkartma animasyonu veya API Call.
   */
  const updateStatus = async (id: string, newStatus: TransactionStatus) => {
    isFetching.value = true;
    error.value = null;
    
    try {
      // Sahte API ZAMANLAMASI simülasyonu
      await new Promise(resolve => setTimeout(resolve, 600));
      const target = transactions.value.find(t => t._id === id);
      
      if (target) {
        target.status = newStatus;
      }
    } catch (e: any) {
      error.value = e.message || 'Bilinmeyen bir hata oluştu.';
    } finally {
      isFetching.value = false;
    }
  }

  return {
    transactions,
    isFetching,
    error,
    updateStatus
  }
}
