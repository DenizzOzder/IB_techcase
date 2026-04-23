import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
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
  async calculateCommission(transactionData: { _id: Types.ObjectId | string; agentId: Types.ObjectId | string; sellingAgentId?: Types.ObjectId | string; propertyPrice: number; commissionRate: number }, session: ClientSession) {
    if (transactionData.propertyPrice <= 0 || transactionData.commissionRate <= 0) {
      throw new Error('Geçersiz işlem tutarı veya komisyon oranı. Değerler sıfırdan büyük olmalıdır.');
    }

    // Emlak satış/kiralama tutarı ve yüzdelik komisyon oranı üzerinden toplam komisyon (Amount)
    const calculatedAmount = (transactionData.propertyPrice * transactionData.commissionRate) / 100;

    // Şirket her koşulda %50 pay alır.
    const agencyAmount = calculatedAmount * 0.50;
    
    let listingAgentAmount = 0;
    let sellingAgentAmount: number | undefined = undefined;

    const listingStr = transactionData.agentId.toString();
    const sellingStr = transactionData.sellingAgentId ? transactionData.sellingAgentId.toString() : null;

    // Senaryo 1: Satan danışman yok veya listeleyen ile aynıysa -> Danışman payı %100 (%50 of total)
    if (!sellingStr || listingStr === sellingStr) {
      listingAgentAmount = calculatedAmount * 0.50;
    } 
    // Senaryo 2: Farklı kişilerse -> Danışman payı ikiye bölünür (%25 - %25 of total)
    else {
      listingAgentAmount = calculatedAmount * 0.25;
      sellingAgentAmount = calculatedAmount * 0.25;
    }

    // Bağımsız Commission koleksiyonuna dökümanı ekle.
    const commission = new this.commissionModel({
      transactionId: transactionData._id,
      amount: calculatedAmount,
      agencyAmount,
      listingAgentAmount,
      sellingAgentAmount,
      status: CommissionStatus.UNPAID
    });

    // Session garantisi: eğer başka bir yerde hata olursa MongoDB kaydı iptal edecek (Rollback).
    await commission.save({ session });
    return commission;
  }
}
