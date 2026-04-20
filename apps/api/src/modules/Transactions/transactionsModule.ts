import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './transactionsController';
import { TransactionsService } from './transactionsService';
import { Transaction, TransactionSchema } from './Schemas/transactionSchema';
import { CommissionsModule } from '../Commissions/commissionsModule';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    CommissionsModule
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
