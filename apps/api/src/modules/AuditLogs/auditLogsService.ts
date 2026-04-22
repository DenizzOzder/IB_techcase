import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { AuditLog, AuditLogDocument } from '@/modules/AuditLogs/Schemas/auditLogSchema';
import { User, UserDocument } from '@/modules/Users/userSchema';
import { AuditLogAction, TransactionStatus, IAuditLogsResponse } from '@repo/types';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  /**
   * İşlem statüsü değiştiğinde log atar.
   * Session parametresi ile MongoDB Transaction (ClientSession) içine dahil edilir.
   */
  async logAction(
    transactionId: string | Types.ObjectId,
    agentId: string | Types.ObjectId,
    propertyTitle: string,
    action: AuditLogAction,
    newStatus: TransactionStatus,
    previousStatus?: TransactionStatus,
    session?: ClientSession,
  ): Promise<void> {
    try {
      // Agent adını bul (Hızlı gösterim için denormalizasyon)
      const agent = await this.userModel.findById(agentId).exec();
      const agentName = agent ? agent.name : 'Bilinmeyen Danışman';

      const logEntry = new this.auditLogModel({
        transactionId: new Types.ObjectId(transactionId),
        agentId: new Types.ObjectId(agentId),
        agentName,
        propertyTitle,
        action,
        previousStatus,
        newStatus,
      });

      await logEntry.save({ session });
    } catch (error) {
      this.logger.error(`Failed to create audit log for transaction ${transactionId}`, error);
      // Fırlatmıyoruz, ana transaction'ı patlatmaması için.
    }
  }

  /**
   * Yönetici paneli için logları listeler (Sayfalama ile).
   */
  async getLogs(page: number = 1, limit: number = 20): Promise<IAuditLogsResponse> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.auditLogModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.auditLogModel.countDocuments().exec()
    ]);

    return {
      data: data.map(log => ({
        _id: log._id.toString(),
        transactionId: log.transactionId.toString(),
        agentId: log.agentId.toString(),
        agentName: log.agentName,
        propertyTitle: log.propertyTitle,
        action: log.action,
        previousStatus: log.previousStatus,
        newStatus: log.newStatus,
        createdAt: (log as any).createdAt?.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}
