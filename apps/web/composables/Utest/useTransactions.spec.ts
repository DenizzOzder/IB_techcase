import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransactions } from '../useTransactions';
import { TransactionStatus } from '@repo/types';
import * as ofetch from 'ofetch';

// Mock Pinia Auth Store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    accessToken: 'mock-jwt-token',
  }),
}));

// Mock ofetch
vi.mock('ofetch', () => ({
  $fetch: vi.fn(),
}));

describe('useTransactions composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchAll should fetch data and update transactions state', async () => {
    const mockData = [
      { _id: '1', propertyTitle: 'Test 1', status: TransactionStatus.AGREEMENT },
    ];
    vi.mocked(ofetch.$fetch).mockResolvedValueOnce(mockData);

    const { transactions, isFetching, fetchAll, hasMore } = useTransactions();
    
    // Test initial state
    expect(transactions.value).toEqual([]);
    expect(isFetching.value).toBe(false);

    // Call fetch
    const fetchPromise = fetchAll(1, 20, false);
    
    // Wait for promise to resolve
    await fetchPromise;

    expect(ofetch.$fetch).toHaveBeenCalledWith('http://localhost:3001/transactions', expect.any(Object));
    expect(transactions.value).toEqual(mockData);
    expect(isFetching.value).toBe(false);
    expect(hasMore.value).toBe(false); // since length is 1, not 20
  });

  it('fetchAll should handle errors and set error state', async () => {
    const errorResponse = { data: { message: 'Unauthorized' } };
    vi.mocked(ofetch.$fetch).mockRejectedValueOnce(errorResponse);

    const { error, fetchAll } = useTransactions();
    
    await fetchAll();

    expect(error.value).toBe('Unauthorized');
  });

  it('createTransaction should send correct payload and refresh list', async () => {
    // Mock the POST request
    vi.mocked(ofetch.$fetch).mockResolvedValueOnce({});
    // Mock the subsequent fetchAll GET request
    vi.mocked(ofetch.$fetch).mockResolvedValueOnce([{ _id: '1' }]);

    const { createTransaction, transactions } = useTransactions();
    
    const payload = { propertyTitle: 'Ev', propertyPrice: 1000, commissionRate: 2 };
    const result = await createTransaction(payload);

    expect(result).toBe(true);
    expect(ofetch.$fetch).toHaveBeenNthCalledWith(1, 'http://localhost:3001/transactions', expect.objectContaining({
      method: 'POST',
      body: payload
    }));
    expect(transactions.value.length).toBe(1);
  });

  it('cancelTransaction should send PATCH request and refresh list', async () => {
    vi.mocked(ofetch.$fetch).mockResolvedValueOnce({});
    vi.mocked(ofetch.$fetch).mockResolvedValueOnce([{ _id: '1', status: TransactionStatus.CANCELLED }]);

    const { cancelTransaction, transactions } = useTransactions();
    
    await cancelTransaction('tx123');

    expect(ofetch.$fetch).toHaveBeenNthCalledWith(1, 'http://localhost:3001/transactions/tx123/cancel', expect.objectContaining({
      method: 'PATCH'
    }));
    expect(transactions.value[0].status).toBe(TransactionStatus.CANCELLED);
  });
});
