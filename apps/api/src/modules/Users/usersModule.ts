import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@/modules/Users/userSchema';
import { UsersService } from '@/modules/Users/usersService';
import { UsersController } from '@/modules/Users/usersController';
import {
  Transaction,
  TransactionSchema,
} from '@/modules/Transactions/Schemas/transactionSchema';
import {
  Commission,
  CommissionSchema,
} from '@/modules/Commissions/Schemas/commissionSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Commission.name, schema: CommissionSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
