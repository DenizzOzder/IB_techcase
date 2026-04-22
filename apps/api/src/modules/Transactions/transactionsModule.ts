import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from '@/modules/Transactions/transactionsController';
import { TransactionsService } from '@/modules/Transactions/transactionsService';
import { Transaction, TransactionSchema } from '@/modules/Transactions/Schemas/transactionSchema';
import { CommissionsModule } from '@/modules/Commissions/commissionsModule';
import { AuditLogsModule } from '@/modules/AuditLogs/auditLogsModule';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    CommissionsModule,
    AuditLogsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

