import { IsString, IsNumber, IsPositive, IsNotEmpty, Min, Max } from 'class-validator';
import { ICreateTransactionRequest } from '@repo/types';

export class CreateTransactionDto implements ICreateTransactionRequest {
  @IsString()
  @IsNotEmpty()
  propertyTitle: string;

  @IsNumber()
  @IsPositive()
  propertyPrice: number;

  @IsString()
  @IsNotEmpty()
  agentName: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;
}
