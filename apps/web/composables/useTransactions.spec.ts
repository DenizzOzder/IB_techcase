import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransactions } from './useTransactions';
import { TransactionStatus } from '@repo/types';

// Mock Nuxt / Pinia stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    accessToken: 'mock-token',
  })),
}));

// Mock ofetch
const mockFetch = vi.fn();
vi.mock('ofetch', () => ({
  $fetch: (...args: any[]) => mockFetch(...args),
}));

describe('useTransactions composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchAll should fetch transactions and update state', async () => {
    mockFetch.mockResolvedValueOnce({ data: [{ _id: '1', propertyTitle: 'Test' }] });

    const { fetchAll, transactions, isFetching, error } = useTransactions();
    
    expect(isFetching.value).toBe(false);
    
    const fetchPromise = fetchAll(1, 20);
    expect(isFetching.value).toBe(true);
    
    await fetchPromise;
    
    expect(isFetching.value).toBe(false);
    expect(error.value).toBe(null);
    expect(transactions.value.length).toBe(1);
    expect(transactions.value[0].propertyTitle).toBe('Test');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/transactions',
      expect.objectContaining({ query: { page: 1, limit: 20 } })
    );
  });

  it('createTransaction should post payload and call fetchAll', async () => {
    mockFetch.mockResolvedValueOnce(true); // create response
    mockFetch.mockResolvedValueOnce({ data: [] }); // fetchAll response
    
    const { createTransaction, error } = useTransactions();
    const payload = { propertyTitle: 'New Prop', propertyPrice: 100, commissionRate: 2 };
    
    const result = await createTransaction(payload);
    
    expect(result).toBe(true);
    expect(error.value).toBe(null);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/transactions',
      expect.objectContaining({ method: 'POST', body: payload })
    );
    // 2nd call should be fetchAll
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('cancelTransaction should call cancel endpoint and handle errors', async () => {
    mockFetch.mockRejectedValueOnce({ data: { message: 'İptal edilemez.' } });
    
    const { cancelTransaction, error } = useTransactions();
    await cancelTransaction('tx-123');
    
    expect(error.value).toBe('İptal edilemez.');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/transactions/tx-123/cancel',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});
