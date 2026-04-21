import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionsController } from '@/modules/Commissions/commissionsController';
import { CommissionsService } from '@/modules/Commissions/commissionsService';
import { Commission, CommissionSchema } from '@/modules/Commissions/Schemas/commissionSchema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Commission.name, schema: CommissionSchema }])
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
