import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '@/modules/Transactions/Schemas/transactionSchema';
import { CommissionsService } from '@/modules/Commissions/commissionsService';
import { AuditLogsService } from '@/modules/AuditLogs/auditLogsService';
import { CreateTransactionDto } from '@/modules/Transactions/Dtos/createTransactionDto';
import { UpdateTransactionStatusDto } from '@/modules/Transactions/Dtos/updateTransactionStatusDto';
import { TransactionStatus, Role, IJwtPayload, AuditLogAction } from '@repo/types';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private readonly commissionsService: CommissionsService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  /**
   * Rol bazlı veri erişimi:
   * - ADMIN → Tüm işlemleri görür
   * - AGENT → Yalnızca kendi agentId'siyle açtığı işlemleri görür (veri izolasyonu)
   */
  async findAll(user: IJwtPayload, page: number = 1, limit: number = 20): Promise<Record<string, unknown>[]> {
    const skip = (page - 1) * limit;
    const matchStage = user.role === Role.ADMIN ? {} : { agentId: new Types.ObjectId(user.sub) };

    const pipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } as Record<string, 1 | -1> },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'commissions',
          localField: '_id',
          foreignField: 'transactionId',
          as: 'commissionData'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'agentId',
          foreignField: '_id',
          as: 'agentData'
        }
      },
      {
        $addFields: {
          calculatedCommission: {
            $cond: {
              if: { $gt: [{ $size: '$commissionData' }, 0] },
              then: { $arrayElemAt: ['$commissionData.amount', 0] },
              else: null
            }
          },
          agentName: {
            $cond: {
              if: { $gt: [{ $size: '$agentData' }, 0] },
              then: { $arrayElemAt: ['$agentData.name', 0] },
              else: null
            }
          }
        }
      },
      {
        $project: {
          commissionData: 0,
          agentData: 0
        }
      }
    ];

    return this.transactionModel.aggregate(pipeline).exec();
  }

  /**
   * Yeni işlem oluşturur. agentId JWT payload'ından (controller) alınır,
   * client payload'ından gelmez — güvenlik politikası gereği.
   */
  async createTransaction(createDto: CreateTransactionDto, agentId: string): Promise<TransactionDocument> {
    const createdTransaction = new this.transactionModel({
      ...createDto,
      agentId: new Types.ObjectId(agentId),
    });
    
    await createdTransaction.save();

    await this.auditLogsService.logAction(
      createdTransaction._id,
      agentId,
      createDto.propertyTitle,
      AuditLogAction.CREATED,
      TransactionStatus.AGREEMENT
    );

    return createdTransaction;
  }

  // State Machine geçiş sırasını zorlayan yardımcı metot (DRY prensibi)
  private readonly STATUS_FLOW: TransactionStatus[] = [
    TransactionStatus.AGREEMENT,
    TransactionStatus.EARNEST_MONEY,
    TransactionStatus.TITLE_DEED,
    TransactionStatus.COMPLETED,
  ];

  private getNextStatus(current: TransactionStatus): TransactionStatus | null {
    const idx = this.STATUS_FLOW.indexOf(current);
    return idx >= 0 && idx < this.STATUS_FLOW.length - 1 ? this.STATUS_FLOW[idx + 1] : null;
  }

  private getPreviousStatus(current: TransactionStatus): TransactionStatus | null {
    const idx = this.STATUS_FLOW.indexOf(current);
    return idx > 0 ? this.STATUS_FLOW[idx - 1] : null;
  }

  /**
   * Sahiplik kontrolü: AGENT yalnızca kendi işlemini güncelleyebilir.
   * ADMIN herhangi bir işlemi güncelleyebilir.
   */
  private assertOwnership(transaction: TransactionDocument, user: IJwtPayload): void {
    if (user.role === Role.AGENT && transaction.agentId?.toString() !== user.sub) {
      throw new BadRequestException('Bu işlem size ait olmadığı için değişiklik yapma yetkiniz bulunmuyor.');
    }
  }

  async updateTransactionStatus(id: string, updateDto: UpdateTransactionStatusDto, user: IJwtPayload): Promise<TransactionDocument> {
    const session = await this.transactionModel.db.startSession();
    session.startTransaction();

    try {
      const transaction = await this.transactionModel.findById(id).session(session);
      if (!transaction) throw new NotFoundException('Aradığınız emlak işlemi bulunamadı.');

      this.assertOwnership(transaction, user);

      const currentStatus = transaction.status;

      // İptal edilmiş veya tamamlanmış işlemlerin durumu değiştirilemez.
      if (currentStatus === TransactionStatus.CANCELLED) {
        throw new BadRequestException('Bu işlem iptal edildiği için üzerinde değişiklik yapamazsınız.');
      }
      if (currentStatus === TransactionStatus.COMPLETED) {
        throw new BadRequestException('İşlem tamamlandığı (Tapu devri bittiği) için artık güncellenemez.');
      }

      // Yalnızca bir sonraki veya bir önceki geçerli adıma geçişe izin ver
      const allowedNext = this.getNextStatus(currentStatus);
      const allowedPrev = this.getPreviousStatus(currentStatus);
      if (updateDto.status !== allowedNext && updateDto.status !== allowedPrev && updateDto.status !== TransactionStatus.CANCELLED) {
        throw new BadRequestException(
          `İşlemleri sırasıyla ilerletmelisiniz. (Mevcut aşama: ${currentStatus}) Doğrudan atlama yapılamaz.`
        );
      }

      const previousStatus = transaction.status;
      transaction.status = updateDto.status;
      await transaction.save({ session });

      if (previousStatus !== TransactionStatus.COMPLETED && updateDto.status === TransactionStatus.COMPLETED) {
        await this.commissionsService.calculateCommission(transaction, session);
      }

      await this.auditLogsService.logAction(
        transaction._id,
        user.sub,
        transaction.propertyTitle,
        updateDto.status === TransactionStatus.COMPLETED ? AuditLogAction.COMPLETED : AuditLogAction.ADVANCED,
        updateDto.status,
        previousStatus,
        session
      );

      await session.commitTransaction();
      session.endSession();
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      // BadRequestException / NotFoundException zaten kullanıcı dostudur, tekrar sarmaya gerek yok.
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new BadRequestException('Sistemde geçici bir sorun oluştu. Lütfen sayfayı yenileyip tekrar deneyin.');
    }
  }

  async cancelTransaction(id: string, user: IJwtPayload): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) throw new NotFoundException('Aradığınız emlak işlemi bulunamadı.');
    this.assertOwnership(transaction, user);
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Bu işlem tamamlandığı için iptal edilemez. Lütfen şirket yöneticisiyle iletişime geçin.');
    }
    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('Bu işlem daha önceden iptal edilmiş.');
    }
    
    const previousStatus = transaction.status;
    transaction.status = TransactionStatus.CANCELLED;
    await transaction.save();

    await this.auditLogsService.logAction(
      transaction._id,
      user.sub,
      transaction.propertyTitle,
      AuditLogAction.CANCELLED,
      TransactionStatus.CANCELLED,
      previousStatus
    );

    return transaction;
  }

  async rollbackTransactionStatus(id: string, user: IJwtPayload): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) throw new NotFoundException('Aradığınız emlak işlemi bulunamadı.');
    this.assertOwnership(transaction, user);
    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('İptal edilen bir işlem tekrar geri alınamaz.');
    }
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('İşlem tamamlandığı için geriye alınamaz. Lütfen şirket yöneticisiyle görüşün.');
    }
    const previousStatus = this.getPreviousStatus(transaction.status);
    if (!previousStatus) {
      throw new BadRequestException('Bu işlem en baş aşamada olduğu için daha fazla geriye alınamaz.');
    }
    
    const oldStatus = transaction.status;
    transaction.status = previousStatus;
    await transaction.save();

    await this.auditLogsService.logAction(
      transaction._id,
      user.sub,
      transaction.propertyTitle,
      AuditLogAction.ROLLED_BACK,
      transaction.status,
      oldStatus
    );

    return transaction;
  }
}