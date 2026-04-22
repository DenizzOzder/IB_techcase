import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '@/modules/Transactions/Schemas/transactionSchema';
import { CommissionsService } from '@/modules/Commissions/commissionsService';
import { CreateTransactionDto } from '@/modules/Transactions/Dtos/createTransactionDto';
import { UpdateTransactionStatusDto } from '@/modules/Transactions/Dtos/updateTransactionStatusDto';
import { TransactionStatus, Role, IJwtPayload } from '@repo/types';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private readonly commissionsService: CommissionsService
  ) {}

  /**
   * Rol bazlı veri erişimi:
   * - ADMIN → Tüm işlemleri görür
   * - AGENT → Yalnızca kendi agentId'siyle açtığı işlemleri görür (veri izolasyonu)
   */
  async findAll(user: IJwtPayload): Promise<TransactionDocument[]> {
    if (user.role === Role.ADMIN) {
      return this.transactionModel.find().exec();
    }
    return this.transactionModel.find({ agentId: new Types.ObjectId(user.sub) }).exec();
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
    return createdTransaction.save();
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
      throw new BadRequestException('Bu işlemi güncelleme yetkiniz bulunmuyor.');
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
        throw new BadRequestException('İptal edilmiş bir işlemin aşaması değiştirilemez.');
      }
      if (currentStatus === TransactionStatus.COMPLETED) {
        throw new BadRequestException('Tamamlanmış bir işlem artık güncellenemez.');
      }

      // Yalnızca bir sonraki veya bir önceki geçerli adıma geçişe izin ver
      const allowedNext = this.getNextStatus(currentStatus);
      const allowedPrev = this.getPreviousStatus(currentStatus);
      if (updateDto.status !== allowedNext && updateDto.status !== allowedPrev && updateDto.status !== TransactionStatus.CANCELLED) {
        throw new BadRequestException(
          `Bu işlemin şu anki aşamasından (${currentStatus}) doğrudan bu aşamaya geçiş yapılamaz.`
        );
      }

      const previousStatus = transaction.status;
      transaction.status = updateDto.status;
      await transaction.save({ session });

      if (previousStatus !== TransactionStatus.COMPLETED && updateDto.status === TransactionStatus.COMPLETED) {
        await this.commissionsService.calculateCommission(transaction, session);
      }

      await session.commitTransaction();
      session.endSession();
      return transaction;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      // BadRequestException / NotFoundException zaten kullanıcı dostudur, tekrar sarmaya gerek yok.
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new BadRequestException('Durum güncellenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  async cancelTransaction(id: string, user: IJwtPayload): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) throw new NotFoundException('Aradığınız emlak işlemi bulunamadı.');
    this.assertOwnership(transaction, user);
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Tamamlanmış bir işlem iptal edilemez. Lütfen yöneticinizle iletişime geçin.');
    }
    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('Bu işlem zaten iptal edilmiş.');
    }
    transaction.status = TransactionStatus.CANCELLED;
    return transaction.save();
  }

  async rollbackTransactionStatus(id: string, user: IJwtPayload): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) throw new NotFoundException('Aradığınız emlak işlemi bulunamadı.');
    this.assertOwnership(transaction, user);
    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('İptal edilmiş bir işlem geri alınamaz.');
    }
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Tamamlanmış bir işlem geri alınamaz. Lütfen yöneticinizle iletişime geçin.');
    }
    const previousStatus = this.getPreviousStatus(transaction.status);
    if (!previousStatus) {
      throw new BadRequestException('Bu işlem zaten başlangıç aşamasında, daha geriye dönülemiyor.');
    }
    transaction.status = previousStatus;
    return transaction.save();
  }
}