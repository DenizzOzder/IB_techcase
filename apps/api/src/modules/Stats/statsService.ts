import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from '@/modules/Transactions/Schemas/transactionSchema';
import { Commission, CommissionDocument } from '@/modules/Commissions/Schemas/commissionSchema';
import {
  IStatsResponse,
  IStatsSummary,
  IStatsTrendItem,
  IStatsStatusItem,
  TransactionStatus,
} from '@repo/types';

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
  ) {}

  async getStats(period: 'monthly' | 'yearly'): Promise<IStatsResponse> {
    const [summary, trend, statusDistribution] = await Promise.all([
      this.getSummary(),
      period === 'monthly' ? this.getMonthlyTrend() : this.getYearlyTrend(),
      this.getStatusDistribution(),
    ]);

    return { summary, trend, statusDistribution, period };
  }

  /** Genel özet istatistikler (tüm zamanlar) */
  private async getSummary(): Promise<IStatsSummary> {
    const [statusCounts, commissionTotal, avgTimeData] = await Promise.all([
      this.transactionModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, volume: { $sum: '$propertyPrice' } } },
      ]),
      this.commissionModel.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$agencyAmount' } } },
      ]),
      this.transactionModel.aggregate([
        { $match: { status: TransactionStatus.COMPLETED } },
        {
          $group: {
            _id: null,
            avgTimeMs: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
          }
        }
      ]),
    ]);

    let completedCount = 0, cancelledCount = 0, activeCount = 0, totalVolume = 0;
    const activeStatuses = [TransactionStatus.AGREEMENT, TransactionStatus.EARNEST_MONEY, TransactionStatus.TITLE_DEED];

    for (const row of statusCounts) {
      if (row._id === TransactionStatus.COMPLETED) { completedCount = row.count; totalVolume = row.volume; }
      if (row._id === TransactionStatus.CANCELLED) cancelledCount = row.count;
      if (activeStatuses.includes(row._id)) activeCount += row.count;
    }

    return {
      totalVolume,
      totalCommission: commissionTotal[0]?.total ?? 0,
      totalTransactions: completedCount + cancelledCount + activeCount,
      completedCount,
      cancelledCount,
      activeCount,
      averageClosingTimeDays: avgTimeData[0]?.avgTimeMs ? parseFloat((avgTimeData[0].avgTimeMs / (1000 * 60 * 60 * 24)).toFixed(1)) : 0,
    };
  }

  /** İçinde bulunulan ayın 4 haftalık trend verisi */
  private async getMonthlyTrend(): Promise<IStatsTrendItem[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const [txTrend, commTrend] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { week: { $add: [{ $floor: { $divide: [ { $subtract: [{ $dayOfMonth: '$createdAt' }, 1] }, 7 ] } }, 1] } },
            count: { $sum: 1 },
            volume: {
              $sum: { $cond: [{ $eq: ['$status', TransactionStatus.COMPLETED] }, '$propertyPrice', 0] },
            },
          },
        },
        { $sort: { '_id.week': 1 } },
      ]),
      this.commissionModel.aggregate([
        { $match: { createdAt: { $gte: start }, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: { week: { $add: [{ $floor: { $divide: [ { $subtract: [{ $dayOfMonth: '$createdAt' }, 1] }, 7 ] } }, 1] } },
            commission: { $sum: '$agencyAmount' },
          },
        },
      ]),
    ]);

    const result: IStatsTrendItem[] = [];
    for (let w = 1; w <= 4; w++) {
      let vol = 0, count = 0, commission = 0;
      
      const matchedTxs = txTrend.filter(r => (w === 4 ? r._id.week >= 4 : r._id.week === w));
      matchedTxs.forEach(r => { vol += r.volume; count += r.count; });
      
      const matchedComms = commTrend.filter(r => (w === 4 ? r._id.week >= 4 : r._id.week === w));
      matchedComms.forEach(r => { commission += r.commission; });

      result.push({
        label: `${w}. Hafta`,
        volume: vol,
        commission: commission,
        count: count,
      });
    }
    return result;
  }

  /** İçinde bulunulan yılın aylık trend verisi */
  private async getYearlyTrend(): Promise<IStatsTrendItem[]> {
    const currentYear = new Date().getFullYear();
    const start = new Date(currentYear, 0, 1);

    const [txTrend, commTrend] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { month: { $month: '$createdAt' } },
            count: { $sum: 1 },
            volume: {
              $sum: { $cond: [{ $eq: ['$status', TransactionStatus.COMPLETED] }, '$propertyPrice', 0] },
            },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),
      this.commissionModel.aggregate([
        { $match: { createdAt: { $gte: start }, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: { month: { $month: '$createdAt' } },
            commission: { $sum: '$agencyAmount' },
          },
        },
      ]),
    ]);

    const result: IStatsTrendItem[] = [];
    for (let m = 1; m <= 12; m++) {
      const tx = txTrend.find(r => r._id.month === m);
      const comm = commTrend.find(r => r._id.month === m);
      result.push({
        label: TR_MONTHS[m - 1],
        volume: tx?.volume ?? 0,
        commission: comm?.commission ?? 0,
        count: tx?.count ?? 0,
      });
    }
    return result;
  }

  /** İşlem statü dağılımı */
  private async getStatusDistribution(): Promise<IStatsStatusItem[]> {
    const rows = await this.transactionModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return rows.map(r => ({ status: r._id as TransactionStatus, count: r.count }));
  }
}
