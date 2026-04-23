import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CommissionsService } from '@/modules/Commissions/commissionsService';
import { Commission } from '@/modules/Commissions/Schemas/commissionSchema';
import { CommissionStatus } from '@repo/types';

describe('CommissionsService', () => {
  let service: CommissionsService;
  
  // Mock Mongoose Model
  class MockCommissionModel {
    constructor(public data: Record<string, unknown>) {}
    save = jest.fn().mockResolvedValue(this);
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        {
          provide: getModelToken(Commission.name),
          useValue: MockCommissionModel,
        },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCommission', () => {
    const mockSession = {} as never; // Mock session

    it('should calculate and save commission correctly', async () => {
      const transactionData = {
        _id: 'tx123',
        propertyPrice: 1000000,
        commissionRate: 2,
      };

      const result = await service.calculateCommission(transactionData, mockSession);

      expect(result).toBeDefined();
      // @ts-ignore
      expect(result.data.transactionId).toBe('tx123');
      // @ts-ignore
      expect(result.data.amount).toBe(20000); // 1.000.000 * %2 = 20.000
      // @ts-ignore
      expect(result.data.status).toBe(CommissionStatus.UNPAID);
    });

    it('should throw an error if propertyPrice is negative or zero', async () => {
      await expect(
        service.calculateCommission(
          { _id: 'tx123', propertyPrice: 0, commissionRate: 2 },
          mockSession
        )
      ).rejects.toThrow('Geçersiz işlem tutarı veya komisyon oranı. Değerler sıfırdan büyük olmalıdır.');

      await expect(
        service.calculateCommission(
          { _id: 'tx123', propertyPrice: -50000, commissionRate: 2 },
          mockSession
        )
      ).rejects.toThrow('Geçersiz işlem tutarı veya komisyon oranı. Değerler sıfırdan büyük olmalıdır.');
    });

    it('should throw an error if commissionRate is negative or zero', async () => {
      await expect(
        service.calculateCommission(
          { _id: 'tx123', propertyPrice: 100000, commissionRate: 0 },
          mockSession
        )
      ).rejects.toThrow('Geçersiz işlem tutarı veya komisyon oranı. Değerler sıfırdan büyük olmalıdır.');

      await expect(
        service.calculateCommission(
          { _id: 'tx123', propertyPrice: 100000, commissionRate: -1 },
          mockSession
        )
      ).rejects.toThrow('Geçersiz işlem tutarı veya komisyon oranı. Değerler sıfırdan büyük olmalıdır.');
    });
  });
});
