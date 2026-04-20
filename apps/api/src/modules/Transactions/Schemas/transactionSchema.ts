import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  // Diğer alanlar ve tipler daha sonra netleştirilecektir
  @Prop()
  status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
