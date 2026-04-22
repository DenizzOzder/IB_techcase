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
    const [statusCounts, commissionTotal] = await Promise.all([
      this.transactionModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, volume: { $sum: '$propertyPrice' } } },
      ]),
      this.commissionModel.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
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
    };
  }

  /** Son 12 aylık trend verisi */
  private async getMonthlyTrend(): Promise<IStatsTrendItem[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [txTrend, commTrend] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
            volume: {
              $sum: { $cond: [{ $eq: ['$status', TransactionStatus.COMPLETED] }, '$propertyPrice', 0] },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      this.commissionModel.aggregate([
        { $match: { createdAt: { $gte: start }, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            commission: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    // Son 12 ayı oluştur (boş aylar da dahil)
    const result: IStatsTrendItem[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const tx = txTrend.find(r => r._id.year === year && r._id.month === month);
      const comm = commTrend.find(r => r._id.year === year && r._id.month === month);

      result.push({
        label: TR_MONTHS[month - 1],
        volume: tx?.volume ?? 0,
        commission: comm?.commission ?? 0,
        count: tx?.count ?? 0,
      });
    }
    return result;
  }

  /** Son 5 yıllık trend verisi */
  private async getYearlyTrend(): Promise<IStatsTrendItem[]> {
    const currentYear = new Date().getFullYear();
    const start = new Date(currentYear - 4, 0, 1);

    const [txTrend, commTrend] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' } },
            count: { $sum: 1 },
            volume: {
              $sum: { $cond: [{ $eq: ['$status', TransactionStatus.COMPLETED] }, '$propertyPrice', 0] },
            },
          },
        },
        { $sort: { '_id.year': 1 } },
      ]),
      this.commissionModel.aggregate([
        { $match: { createdAt: { $gte: start }, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' } },
            commission: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const result: IStatsTrendItem[] = [];
    for (let y = currentYear - 4; y <= currentYear; y++) {
      const tx = txTrend.find(r => r._id.year === y);
      const comm = commTrend.find(r => r._id.year === y);
      result.push({
        label: String(y),
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
