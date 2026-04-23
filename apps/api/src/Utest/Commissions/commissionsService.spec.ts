/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
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

    it('Scenario 1: should correctly calculate commission when listing and selling agents are the same', async () => {
      const transactionData = {
        _id: new Types.ObjectId().toString(),
        agentId: new Types.ObjectId().toString(),
        propertyPrice: 1000000,
        commissionRate: 2, // %2
      };

      const result = await service.calculateCommission(
        transactionData,
        mockSession,
      );

      expect(result.transactionId).toBe(transactionData._id);
      expect(result.amount).toBe(20000); // 1,000,000 * 2 / 100 = 20,000
      expect(result.agencyAmount).toBe(10000); // 50%
      expect(result.listingAgentAmount).toBe(10000); // 50%
      expect(result.sellingAgentAmount).toBeUndefined();
      expect(result.status).toBe(CommissionStatus.UNPAID);
      expect(result.save).toHaveBeenCalledWith({ session: mockSession });
    });

    it('Scenario 2: should correctly split commission when listing and selling agents are different', async () => {
      const transactionData = {
        _id: new Types.ObjectId().toString(),
        agentId: new Types.ObjectId().toString(),
        sellingAgentId: new Types.ObjectId().toString(),
        propertyPrice: 1000000,
        commissionRate: 2,
      };

      const result = await service.calculateCommission(
        transactionData,
        mockSession,
      );

      expect(result.amount).toBe(20000);
      expect(result.agencyAmount).toBe(10000); // 50%
      expect(result.listingAgentAmount).toBe(5000); // 25%
      expect(result.sellingAgentAmount).toBe(5000); // 25%
      expect(result.status).toBe(CommissionStatus.UNPAID);
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
