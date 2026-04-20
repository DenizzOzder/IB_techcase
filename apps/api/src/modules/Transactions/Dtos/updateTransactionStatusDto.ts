import { IsEnum, IsNotEmpty } from 'class-validator';
import { IUpdateTransactionStatusRequest, TransactionStatus } from '@repo/types';

export class UpdateTransactionStatusDto implements IUpdateTransactionStatusRequest {
  @IsEnum(TransactionStatus, { message: 'Geçersiz işlem durumu sağlandı.' })
  @IsNotEmpty()
  status: TransactionStatus;
}
