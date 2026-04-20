import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Commission, CommissionDocument } from './Schemas/commissionSchema';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>
  ) {}

  /**
   * MongoDB Transactions desteğiyle komisyon hesaplaması.
   * @param transactionData Komisyonu hesaplanacak işlem verisi
   * @param session MongoDB Transaction oturumu
   */
  async calculateCommission(transactionData: any, session?: ClientSession) {
    // İzole edilebilir iş ve hesaplama mantığı eklenecek
  }
}
