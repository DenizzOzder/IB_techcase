import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsController } from '@/modules/Stats/statsController';
import { StatsService } from '@/modules/Stats/statsService';
import { Transaction, TransactionSchema } from '@/modules/Transactions/Schemas/transactionSchema';
import { Commission, CommissionSchema } from '@/modules/Commissions/Schemas/commissionSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Commission.name, schema: CommissionSchema },
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
