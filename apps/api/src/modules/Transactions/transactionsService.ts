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

  async updateTransactionStatus(id: string, updateDto: UpdateTransactionStatusDto): Promise<TransactionDocument> {
    // 1. Transaction için MongoDB Session başlatıyoruz.
    const session = await this.transactionModel.db.startSession();
    session.startTransaction();

    try {
      const transaction = await this.transactionModel.findById(id).session(session);
      if (!transaction) throw new NotFoundException('Transaction bulunamadı.');
      
      const previousStatus = transaction.status;
      transaction.status = updateDto.status;
      
      // Tapu / İşlem kendi koleksiyonunda güncellendi. (Şu an bellekte)
      await transaction.save({ session });

      // 2. Eğer COMPLETED aşamasına geçiliyorsa Komisyon tetiklenir:
      if (previousStatus !== TransactionStatus.COMPLETED && updateDto.status === TransactionStatus.COMPLETED) {
        // commissionsService aynı session anahtarını kullanarak işlemi dondurulmuş veritabanına geçirir.
        await this.commissionsService.calculateCommission(transaction, session);
      }

      // 3. Her şey başarılı. Veritabanına fiziksel olarak yansıt. (Commit)
      await session.commitTransaction();
      session.endSession();

      return transaction;
    } catch (error) {
      // 4. Herhangi bir hata durumunda (Hata fırlatılması) veriyi geri sar. (Abort & Rollback)
      await session.abortTransaction();
      session.endSession();
      throw new BadRequestException(`İşlem sırasında bir hata oluştu: ${error.message}`);
    }
  }
}
