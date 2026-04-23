import { IsEnum, IsNotEmpty } from 'class-validator';
import {
  IUpdateTransactionStatusRequest,
  TransactionStatus,
} from '@repo/types';

export class UpdateTransactionStatusDto implements IUpdateTransactionStatusRequest {
  @IsEnum(TransactionStatus, {
    message:
      'Seçilen işlem aşaması geçerli değil. Lütfen geçerli bir aşama seçin.',
  })
  @IsNotEmpty()
  status: TransactionStatus;
}
