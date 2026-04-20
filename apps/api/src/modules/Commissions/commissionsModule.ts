import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionsController } from './commissionsController';
import { CommissionsService } from './commissionsService';
import { Commission, CommissionSchema } from './Schemas/commissionSchema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Commission.name, schema: CommissionSchema }])
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
