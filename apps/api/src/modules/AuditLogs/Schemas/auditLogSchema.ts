import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuditLogAction, TransactionStatus } from '@repo/types';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Transaction' })
  transactionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  agentId: Types.ObjectId;

  @Prop({ required: true })
  agentName: string;

  @Prop({ required: true })
  propertyTitle: string;

  @Prop({ type: String, enum: AuditLogAction, required: true })
  action: AuditLogAction;

  @Prop({ type: String, enum: TransactionStatus })
  previousStatus?: TransactionStatus;

  @Prop({ type: String, enum: TransactionStatus, required: true })
  newStatus: TransactionStatus;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ agentId: 1, action: 1, createdAt: -1 });
