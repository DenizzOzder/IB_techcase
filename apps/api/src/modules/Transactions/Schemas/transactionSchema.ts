import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ITransaction, TransactionStatus } from '@repo/types';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction implements Omit<
  ITransaction,
  | '_id'
  | 'agentId'
  | 'sellingAgentId'
  | 'pendingSellingAgentId'
  | 'agentName'
  | 'createdAt'
  | 'updatedAt'
> {
  @Prop({ required: true })
  propertyTitle: string;

  @Prop({ required: true })
  propertyPrice: number;

  /**
   * JWT'den alınan danışman User._id referansı.
   * Veri izolasyonu: AGENT yalnızca kendi agentId'siyle eşleşen işlemleri görür.
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  agentId: Types.ObjectId;

  /** İsteğe bağlı olarak atanan selling agent */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  sellingAgentId?: Types.ObjectId;

  /** Başka bir danışmanın veya şirketin ilanını üzerine alma talebi */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  pendingSellingAgentId?: Types.ObjectId;

  /** Şirket (Admin) tarafından mı oluşturuldu? */
  @Prop({ type: Boolean, default: false })
  isCompanyListing: boolean;

  /** Geriye dönük uyumluluk için optional bırakıldı */
  @Prop({ required: false })
  agentName?: string;

  @Prop({ required: true })
  commissionRate: number;

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.AGREEMENT,
  })
  status: TransactionStatus;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ agentId: 1, status: 1, createdAt: -1 });
