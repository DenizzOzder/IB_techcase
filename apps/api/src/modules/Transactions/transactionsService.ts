import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Transaction, TransactionDocument } from './Schemas/transactionSchema';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>
  ) {}

  /**
   * MongoDB Transactions (ClientSession) altyapısı bu serviste kullanılacak.
   * @param data İşlem verisi
   * @param session İşlemin bağımlı olduğu MongoDB Session
   */
  async processTransaction(data: any, session?: ClientSession) {
    // Karmaşık iş mantıkları buraya eklenecek
  }
}
