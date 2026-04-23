import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TransactionsService } from '@/modules/Transactions/transactionsService';
import { CommissionsService } from '@/modules/Commissions/commissionsService';
import { AuditLogsService } from '@/modules/AuditLogs/auditLogsService';
import { Transaction } from '@/modules/Transactions/Schemas/transactionSchema';
import { Types } from 'mongoose';
import { TransactionStatus, Role, AuditLogAction } from '@repo/types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockCommissionsService: any;
  let mockAuditLogsService: any;
  let mockTransactionModel: any;

  beforeEach(async () => {
    mockCommissionsService = {
      calculateCommission: jest.fn(),
    };

    mockAuditLogsService = {
      logAction: jest.fn(),
    };

    mockTransactionModel = {
      aggregate: jest.fn(),
      findById: jest.fn(),
      db: {
        startSession: jest.fn().mockResolvedValue({
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          abortTransaction: jest.fn(),
          endSession: jest.fn(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: CommissionsService,
          useValue: mockCommissionsService,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('updateTransactionStatus', () => {
    const mockUser = { sub: new Types.ObjectId().toString(), email: 'agent@test.com', role: Role.AGENT };
    const txId = new Types.ObjectId().toString();

    it('should throw NotFoundException if transaction does not exist', async () => {
      mockTransactionModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(null)
      });

      await expect(service.updateTransactionStatus(txId, { status: TransactionStatus.EARNEST_MONEY }, mockUser))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if agent is not the owner', async () => {
      const tx = {
        _id: txId,
        agentId: new Types.ObjectId(),
        status: TransactionStatus.AGREEMENT
      };
      
      mockTransactionModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(tx)
      });

      await expect(service.updateTransactionStatus(txId, { status: TransactionStatus.EARNEST_MONEY }, mockUser))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if trying to skip state machine flow (AGREEMENT -> TITLE_DEED)', async () => {
      const tx = {
        _id: txId,
        agentId: mockUser.sub,
        status: TransactionStatus.AGREEMENT
      };
      
      mockTransactionModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(tx)
      });

      await expect(service.updateTransactionStatus(txId, { status: TransactionStatus.TITLE_DEED }, mockUser))
        .rejects.toThrow(BadRequestException);
    });

    it('should correctly advance state from AGREEMENT to EARNEST_MONEY', async () => {
      const tx = {
        _id: txId,
        agentId: mockUser.sub,
        propertyTitle: 'Test Prop',
        status: TransactionStatus.AGREEMENT,
        save: jest.fn().mockResolvedValue(true)
      };
      
      mockTransactionModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(tx)
      });

      const res = await service.updateTransactionStatus(txId, { status: TransactionStatus.EARNEST_MONEY }, mockUser);

      expect(res.status).toBe(TransactionStatus.EARNEST_MONEY);
      expect(tx.save).toHaveBeenCalled();
      expect(mockAuditLogsService.logAction).toHaveBeenCalledWith(
        txId, mockUser.sub, 'Test Prop', AuditLogAction.ADVANCED, TransactionStatus.EARNEST_MONEY, TransactionStatus.AGREEMENT, expect.anything()
      );
    });

    it('should calculate commission when moving to COMPLETED', async () => {
      const tx = {
        _id: txId,
        agentId: mockUser.sub,
        propertyTitle: 'Test Prop',
        status: TransactionStatus.TITLE_DEED,
        save: jest.fn().mockResolvedValue(true)
      };
      
      mockTransactionModel.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue(tx)
      });

      await service.updateTransactionStatus(txId, { status: TransactionStatus.COMPLETED }, mockUser);

      expect(tx.status).toBe(TransactionStatus.COMPLETED);
      expect(mockCommissionsService.calculateCommission).toHaveBeenCalled();
    });
  });
});
