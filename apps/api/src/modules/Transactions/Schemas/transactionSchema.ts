import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ITransaction, TransactionStatus } from '@repo/types';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction implements Omit<ITransaction, '_id' | 'createdAt' | 'updatedAt'> {
  @Prop({ required: true })
  propertyTitle: string;

  @Prop({ required: true })
  propertyPrice: number;

  @Prop({ required: true })
  agentName: string;

  @Prop({ required: true })
  commissionRate: number;

  @Prop({ type: String, enum: TransactionStatus, default: TransactionStatus.AGREEMENT })
  status: TransactionStatus;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
