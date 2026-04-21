import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { TransactionsService } from '@/modules/Transactions/transactionsService';
import { CreateTransactionDto } from '@/modules/Transactions/Dtos/createTransactionDto';
import { UpdateTransactionStatusDto } from '@/modules/Transactions/Dtos/updateTransactionStatusDto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getAll() {
    return this.transactionsService.findAll();
  }

  @Post()
  async create(@Body() createDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(createDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionStatusDto
  ) {
    return this.transactionsService.updateTransactionStatus(id, updateDto);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.transactionsService.cancelTransaction(id);
  }

  @Patch(':id/rollback')
  async rollback(@Param('id') id: string) {
    return this.transactionsService.rollbackTransactionStatus(id);
  }
}
