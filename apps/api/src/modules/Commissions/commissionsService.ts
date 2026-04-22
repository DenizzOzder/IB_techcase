import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Commission, CommissionDocument } from '@/modules/Commissions/Schemas/commissionSchema';
import { CommissionStatus, ITransaction } from '@repo/types';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>
  ) {}

  /**
   * MongoDB Transactions desteğiyle komisyon hesaplaması.
   * COMPLETED statüsüne alınan transaction üzerinden tetiklenir.
   */
  async calculateCommission(transactionData: { _id: any; propertyPrice: number; commissionRate: number }, session: ClientSession) {
    if (transactionData.propertyPrice <= 0 || transactionData.commissionRate <= 0) {
      throw new Error('Geçersiz işlem tutarı veya komisyon oranı. Değerler sıfırdan büyük olmalıdır.');
    }

    // Emlak satış/kiralama tutarı ve yüzdelik komisyon oranı üzerinden matematiksel hesap.
    const calculatedAmount = (transactionData.propertyPrice * transactionData.commissionRate) / 100;

    // Bağımsız Commission koleksiyonuna dökümanı ekle.
    const commission = new this.commissionModel({
      transactionId: transactionData._id,
      amount: calculatedAmount,
      status: CommissionStatus.UNPAID
    });

    // Session garantisi: eğer başka bir yerde hata olursa MongoDB kaydı iptal edecek (Rollback).
    await commission.save({ session });
    return commission;
  }
}
