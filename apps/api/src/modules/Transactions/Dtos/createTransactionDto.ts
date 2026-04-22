import { IsString, IsNumber, IsPositive, IsNotEmpty, Min, Max } from 'class-validator';
import { ICreateTransactionRequest } from '@repo/types';

export class CreateTransactionDto implements ICreateTransactionRequest {
  @IsString({ message: 'Mülk adı geçerli bir metin olmalıdır.' })
  @IsNotEmpty({ message: 'Mülk adı boş bırakılamaz.' })
  propertyTitle: string;

  @IsNumber({}, { message: 'Satış tutarı sayısal bir değer olmalıdır.' })
  @IsPositive({ message: 'Satış tutarı sıfırdan büyük olmalıdır. Lütfen geçerli bir tutar girin.' })
  propertyPrice: number;

  // agentId → JWT token'dan alınır, client payload'ında gelmez (güvenlik gereği)

  @IsNumber({}, { message: 'Komisyon oranı sayısal bir değer olmalıdır.' })
  @Min(0, { message: 'Komisyon oranı en az %0 olabilir.' })
  @Max(100, { message: 'Komisyon oranı en fazla %100 olabilir.' })
  commissionRate: number;
}