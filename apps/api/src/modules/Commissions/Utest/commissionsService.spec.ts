import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from '../commissionsService';
import { getModelToken } from '@nestjs/mongoose';
import { Commission } from '../Schemas/commissionSchema';
import { ClientSession } from 'mongoose';
import { CommissionStatus } from '@repo/types';

describe('CommissionsService (Mock Tests)', () => {
  let service: CommissionsService;

  // Gerçek bir MongoDB ihtiyacını yok ediyoruz. Modeli Mockluyoruz.
  const mockCommissionModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue(true)
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        {
          provide: getModelToken(Commission.name),
          useValue: mockCommissionModel
        }
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('Servis başarılı bir şekilde initialize edilmeli', () => {
    expect(service).toBeDefined();
  });

  it('Emlak degeri 5,000,000 ve komisyon orani %2 secildiginde; Tutar: 100,000 olmalı ve UNPAID olarak kaydedilmeli', async () => {
    // İzole Test Datası
    const mockTransactionData = {
      _id: 'sample_transaction_id',
      propertyPrice: 5000000,
      commissionRate: 2
    };

    // Sahte MongoDB session nesnesi (Herhangi bir ClientSession metodu kullanılmadığı için sade geçilebilir)
    const mockSession = {} as ClientSession;
    
    const result = await service.calculateCommission(mockTransactionData, mockSession);
    
    // Değerlendirmeler
    expect(result.amount).toBe(100000); // 5000000 * 2 / 100 = 100,000
    expect(result.status).toBe(CommissionStatus.UNPAID); // Otomatik olarak UNPAID tahsis edilir
    expect(result.transactionId).toBe('sample_transaction_id'); 
  });
});
