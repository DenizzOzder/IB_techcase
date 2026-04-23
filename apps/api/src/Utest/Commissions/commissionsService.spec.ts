/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CommissionsService } from '@/modules/Commissions/commissionsService';
import { Commission } from '@/modules/Commissions/Schemas/commissionSchema';
import { Types } from 'mongoose';
import { CommissionStatus } from '@repo/types';

describe('CommissionsService', () => {
  let service: CommissionsService;

  // Mock Mongoose Model
  const mockCommissionModel = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue(true),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        {
          provide: getModelToken(Commission.name),
          useValue: mockCommissionModel,
        },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCommission', () => {
    const mockSession = {} as any;

    it('Senaryo 1: Şirketin ilanıysa ve tek danışman varsa (Satan 50% - Şirket 50%)', async () => {
      const transactionData = {
        _id: new Types.ObjectId().toString(),
        agentId: new Types.ObjectId().toString(),
        isCompanyListing: true,
        propertyPrice: 1000000,
        commissionRate: 2, // Toplam 20,000
      };

      const result = await service.calculateCommission(
        transactionData,
        mockSession,
      );

      expect(result.amount).toBe(20000);
      expect(result.agencyAmount).toBe(10000); // 50% Şirket
      expect(result.listingAgentAmount).toBe(10000); // 50% Agent
      expect(result.sellingAgentAmount).toBeUndefined();
      expect(result.status).toBe(CommissionStatus.UNPAID);
    });

    it('Senaryo 2: Şirket İlanı fakat 2 agent işin içindeyse (Agentlar 25% - 25% ve Şirket 50%)', async () => {
      const transactionData = {
        _id: new Types.ObjectId().toString(),
        agentId: new Types.ObjectId().toString(),
        sellingAgentId: new Types.ObjectId().toString(),
        isCompanyListing: true,
        propertyPrice: 1000000,
        commissionRate: 2,
      };

      const result = await service.calculateCommission(
        transactionData,
        mockSession,
      );

      expect(result.amount).toBe(20000);
      expect(result.agencyAmount).toBe(10000); // 50% Şirket
      expect(result.listingAgentAmount).toBe(5000); // 25% Agent 1
      expect(result.sellingAgentAmount).toBe(5000); // 25% Agent 2
    });

    it('Senaryo 3: Agent kendi ilanıysa (Agent 100% komisyon alır, Şirket %0)', async () => {
      const transactionData = {
        _id: new Types.ObjectId().toString(),
        agentId: new Types.ObjectId().toString(),
        isCompanyListing: false,
        propertyPrice: 1000000,
        commissionRate: 2,
      };

      const result = await service.calculateCommission(
        transactionData,
        mockSession,
      );

      expect(result.amount).toBe(20000);
      expect(result.agencyAmount).toBe(0); // 0% Şirket
      expect(result.listingAgentAmount).toBe(20000); // 100% Agent
      expect(result.sellingAgentAmount).toBeUndefined();
    });

    it('Senaryo 4: Agent kendi ilanını başka agent satarsa (50% - 50% komisyon bölüştürülür, Şirket %0)', async () => {
      const transactionData = {
        _id: new Types.ObjectId().toString(),
        agentId: new Types.ObjectId().toString(),
        sellingAgentId: new Types.ObjectId().toString(),
        isCompanyListing: false,
        propertyPrice: 1000000,
        commissionRate: 2,
      };

      const result = await service.calculateCommission(
        transactionData,
        mockSession,
      );

      expect(result.amount).toBe(20000);
      expect(result.agencyAmount).toBe(0); // 0% Şirket
      expect(result.listingAgentAmount).toBe(10000); // 50% Agent 1
      expect(result.sellingAgentAmount).toBe(10000); // 50% Agent 2
    });

    it('should throw an error if propertyPrice is 0 or negative', async () => {
      const transactionData = {
        _id: new Types.ObjectId().toString(),
        agentId: new Types.ObjectId().toString(),
        propertyPrice: 0,
        commissionRate: 2,
      };

      await expect(
        service.calculateCommission(transactionData, mockSession),
      ).rejects.toThrow(
        'İşlem tutarı veya komisyon oranı sıfır girildiği için hesaplama yapılamadı.',
      );
    });

    it('should throw an error if commissionRate is 0 or negative', async () => {
      const transactionData = {
        _id: new Types.ObjectId().toString(),
        agentId: new Types.ObjectId().toString(),
        propertyPrice: 1000000,
        commissionRate: -1,
      };

      await expect(
        service.calculateCommission(transactionData, mockSession),
      ).rejects.toThrow(
        'İşlem tutarı veya komisyon oranı sıfır girildiği için hesaplama yapılamadı.',
      );
    });
  });
});
