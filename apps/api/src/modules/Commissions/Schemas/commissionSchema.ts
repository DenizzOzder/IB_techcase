import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ICommission, CommissionStatus } from '@repo/types';

export type CommissionDocument = Commission & Document;

@Schema({ timestamps: true })
export class Commission implements Omit<
  ICommission,
  '_id' | 'transactionId' | 'createdAt' | 'updatedAt'
> {
  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transactionId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  agencyAmount: number;

  @Prop({ required: true })
  listingAgentAmount: number;

  @Prop({ required: false })
  sellingAgentAmount?: number;

  @Prop({
    type: String,
    enum: CommissionStatus,
    default: CommissionStatus.UNPAID,
  })
  status: CommissionStatus;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);
