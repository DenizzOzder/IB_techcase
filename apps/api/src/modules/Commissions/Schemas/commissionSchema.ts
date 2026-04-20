import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommissionDocument = Commission & Document;

@Schema({ timestamps: true })
export class Commission {
  // İlişkisel Transaction belgesi formatımız (Referans kuralı)
  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transactionId: Types.ObjectId;

  @Prop()
  amount: number;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);
