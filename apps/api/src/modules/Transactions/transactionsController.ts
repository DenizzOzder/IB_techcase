import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from '@/modules/Transactions/transactionsService';
import { CreateTransactionDto } from '@/modules/Transactions/Dtos/createTransactionDto';
import { UpdateTransactionStatusDto } from '@/modules/Transactions/Dtos/updateTransactionStatusDto';
import { JwtAuthGuard } from '@/Common/Guards/jwtAuthGuard';
import { RolesGuard } from '@/Common/Guards/rolesGuard';
import { Roles } from '@/Common/Decorators/rolesDecorator';
import { CurrentUser } from '@/Common/Decorators/currentUserDecorator';
import { Role } from '@repo/types';
import type { IJwtPayload } from '@repo/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /** ADMIN → tüm işlemler, AGENT → yalnızca kendi işlemleri (service katmanında izole edilir) */
  @Get()
  @Roles(Role.ADMIN, Role.AGENT)
  async getAll(@CurrentUser() user: IJwtPayload) {
    return this.transactionsService.findAll(user);
  }

  /** Yeni işlem: agentId JWT'den alınır, client göndermiyor */
  @Post()
  @Roles(Role.ADMIN, Role.AGENT)
  async create(@Body() createDto: CreateTransactionDto, @CurrentUser() user: IJwtPayload) {
    return this.transactionsService.createTransaction(createDto, user.sub);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.AGENT)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionStatusDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.transactionsService.updateTransactionStatus(id, updateDto, user);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.AGENT)
  async cancel(@Param('id') id: string, @CurrentUser() user: IJwtPayload) {
    return this.transactionsService.cancelTransaction(id, user);
  }

  @Patch(':id/rollback')
  @Roles(Role.ADMIN, Role.AGENT)
  async rollback(@Param('id') id: string, @CurrentUser() user: IJwtPayload) {
    return this.transactionsService.rollbackTransactionStatus(id, user);
  }
}

