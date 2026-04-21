import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from './Schemas/transactionSchema';
import { CommissionsService } from '../Commissions/commissionsService';
import { CreateTransactionDto } from './Dtos/createTransactionDto';
import { UpdateTransactionStatusDto } from './Dtos/updateTransactionStatusDto';
import { TransactionStatus } from '@repo/types';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private readonly commissionsService: CommissionsService
  ) {}

  async findAll(): Promise<TransactionDocument[]> {
    // Tüm kayıtları listelemek için eklendi (Aşama 6 Frontend Get isteği için)
    return this.transactionModel.find().exec();
  }

  async createTransaction(createDto: CreateTransactionDto): Promise<TransactionDocument> {
    const createdTransaction = new this.transactionModel(createDto);
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

  async updateTransactionStatus(id: string, updateDto: UpdateTransactionStatusDto): Promise<TransactionDocument> {
    const session = await this.transactionModel.db.startSession();
    session.startTransaction();

    try {
      const transaction = await this.transactionModel.findById(id).session(session);
      if (!transaction) throw new NotFoundException('Aradığınız emlak işlemi bulunamadı.');

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

  async cancelTransaction(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) throw new NotFoundException('Aradığınız emlak işlemi bulunamadı.');
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Tamamlanmış bir işlem iptal edilemez. Lütfen yöneticinizle iletişime geçin.');
    }
    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new BadRequestException('Bu işlem zaten iptal edilmiş.');
    }
    transaction.status = TransactionStatus.CANCELLED;
    return transaction.save();
  }

  async rollbackTransactionStatus(id: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) throw new NotFoundException('Aradığınız emlak işlemi bulunamadı.');
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