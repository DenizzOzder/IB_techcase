import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from '../transactionsService';
import { CommissionsService } from '../../Commissions/commissionsService';
import { AuditLogsService } from '../../AuditLogs/auditLogsService';
import { Transaction } from '../Schemas/transactionSchema';
import { TransactionStatus, Role, IJwtPayload } from '@repo/types';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockTransactionModel: any;
  let mockCommissionsService: any;
  let mockAuditLogsService: any;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const agentUser: IJwtPayload = { sub: '507f1f77bcf86cd799439011', email: 'agent@test.com', role: Role.AGENT };

  beforeEach(async () => {
    mockTransactionModel = {
      db: { startSession: jest.fn().mockResolvedValue(mockSession) },
      findById: jest.fn(),
    };
    
    // We need to mock the constructor for "new this.transactionModel()"
    const modelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: 'tx123',
      save: jest.fn().mockResolvedValue({ ...dto, _id: 'tx123' }),
    }));
    Object.assign(modelConstructor, mockTransactionModel);

    mockCommissionsService = {
      calculateCommission: jest.fn(),
    };

    mockAuditLogsService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getModelToken(Transaction.name),
          useValue: modelConstructor,
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should create a transaction and log action', async () => {
      const createDto = {
        propertyTitle: 'Test Evi',
        propertyPrice: 500000,
        commissionRate: 2,
      };

      const result = await service.createTransaction(createDto, agentUser.sub);

      expect(result).toBeDefined();
      expect(result.propertyTitle).toBe('Test Evi');
      expect(mockAuditLogsService.logAction).toHaveBeenCalled();
    });
  });

  describe('updateTransactionStatus', () => {
    it('should throw BadRequestException if jumping states (AGREEMENT -> TITLE_DEED)', async () => {
      const tx = {
        _id: 'tx123',
        agentId: { toString: () => '507f1f77bcf86cd799439011' },
        status: TransactionStatus.AGREEMENT,
        save: jest.fn(),
      };
      
      const sessionMock = {
        session: jest.fn().mockResolvedValue(tx)
      };
      mockTransactionModel.findById.mockReturnValue(sessionMock);

      await expect(
        service.updateTransactionStatus('tx123', { status: TransactionStatus.TITLE_DEED }, agentUser)
      ).rejects.toThrow(BadRequestException);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should allow valid state transition (AGREEMENT -> EARNEST_MONEY)', async () => {
      const tx = {
        _id: 'tx123',
        agentId: { toString: () => '507f1f77bcf86cd799439011' },
        status: TransactionStatus.AGREEMENT,
        propertyTitle: 'Evi',
        save: jest.fn(),
      };
      const sessionMock = { session: jest.fn().mockResolvedValue(tx) };
      mockTransactionModel.findById.mockReturnValue(sessionMock);

      await service.updateTransactionStatus('tx123', { status: TransactionStatus.EARNEST_MONEY }, agentUser);
      
      expect(tx.status).toBe(TransactionStatus.EARNEST_MONEY);
      expect(tx.save).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockAuditLogsService.logAction).toHaveBeenCalled();
    });
  });

  describe('cancelTransaction', () => {
    it('should throw BadRequestException if transaction is already COMPLETED', async () => {
      const tx = {
        _id: 'tx123',
        agentId: { toString: () => '507f1f77bcf86cd799439011' },
        status: TransactionStatus.COMPLETED,
        save: jest.fn(),
      };
      mockTransactionModel.findById.mockResolvedValue(tx);

      await expect(service.cancelTransaction('tx123', agentUser)).rejects.toThrow(BadRequestException);
      await expect(service.cancelTransaction('tx123', agentUser)).rejects.toThrow('Tamamlanmış bir işlem iptal edilemez.');
    });

    it('should successfully cancel a pending transaction', async () => {
      const tx = {
        _id: 'tx123',
        agentId: { toString: () => '507f1f77bcf86cd799439011' },
        status: TransactionStatus.AGREEMENT,
        propertyTitle: 'Evi',
        save: jest.fn(),
      };
      mockTransactionModel.findById.mockResolvedValue(tx);

      await service.cancelTransaction('tx123', agentUser);
      expect(tx.status).toBe(TransactionStatus.CANCELLED);
      expect(tx.save).toHaveBeenCalled();
    });
  });

  describe('rollbackTransactionStatus', () => {
    it('should throw BadRequestException if transaction is in AGREEMENT (no previous state)', async () => {
      const tx = {
        _id: 'tx123',
        agentId: { toString: () => '507f1f77bcf86cd799439011' },
        status: TransactionStatus.AGREEMENT,
        save: jest.fn(),
      };
      mockTransactionModel.findById.mockResolvedValue(tx);

      await expect(service.rollbackTransactionStatus('tx123', agentUser)).rejects.toThrow(BadRequestException);
      await expect(service.rollbackTransactionStatus('tx123', agentUser)).rejects.toThrow('Bu işlem zaten başlangıç aşamasında, daha geriye dönülemiyor.');
    });

    it('should rollback EARNEST_MONEY to AGREEMENT', async () => {
      const tx = {
        _id: 'tx123',
        agentId: { toString: () => '507f1f77bcf86cd799439011' },
        status: TransactionStatus.EARNEST_MONEY,
        propertyTitle: 'Evi',
        save: jest.fn(),
      };
      mockTransactionModel.findById.mockResolvedValue(tx);

      await service.rollbackTransactionStatus('tx123', agentUser);
      expect(tx.status).toBe(TransactionStatus.AGREEMENT);
      expect(tx.save).toHaveBeenCalled();
    });
  });
});
