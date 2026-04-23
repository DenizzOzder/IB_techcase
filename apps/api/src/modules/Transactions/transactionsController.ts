import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from '@/modules/Transactions/transactionsService';
import { CreateTransactionDto } from '@/modules/Transactions/Dtos/createTransactionDto';
import { UpdateTransactionStatusDto } from '@/modules/Transactions/Dtos/updateTransactionStatusDto';
import { JwtAuthGuard } from '@/Common/Guards/jwtAuthGuard';
import { RolesGuard } from '@/Common/Guards/rolesGuard';
import { Roles } from '@/Common/Decorators/rolesDecorator';
import { CurrentUser } from '@/Common/Decorators/currentUserDecorator';
import { ParseMongoIdPipe } from '@/Common/Pipes/parseMongoIdPipe';
import { Role } from '@repo/types';
import type { IJwtPayload } from '@repo/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /** ADMIN → tüm işlemler, AGENT → yalnızca kendi işlemleri (service katmanında izole edilir) */
  @Get()
  @Roles(Role.ADMIN, Role.AGENT)
  async getAll(
    @CurrentUser() user: IJwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'my' | 'company' | 'all',
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    const listType = type || 'all';
    return this.transactionsService.findAll(
      user,
      pageNumber,
      limitNumber,
      listType,
    );
  }

  /** Yeni işlem: agentId JWT'den alınır, client göndermiyor */
  @Post()
  @Roles(Role.ADMIN, Role.AGENT)
  async create(
    @Body() createDto: CreateTransactionDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.transactionsService.createTransaction(createDto, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.AGENT)
  async updateStatus(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateDto: UpdateTransactionStatusDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.transactionsService.updateTransactionStatus(
      id,
      updateDto,
      user,
    );
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.AGENT)
  async cancel(
    @Param('id', ParseMongoIdPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.transactionsService.cancelTransaction(id, user);
  }

  @Patch(':id/rollback')
  @Roles(Role.ADMIN, Role.AGENT)
  async rollback(
    @Param('id', ParseMongoIdPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.transactionsService.rollbackTransactionStatus(id, user);
  }

  @Patch(':id/claim')
  @Roles(Role.ADMIN, Role.AGENT)
  async claimTransaction(
    @Param('id', ParseMongoIdPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.transactionsService.claimTransaction(id, user);
  }

  @Patch(':id/approve-claim')
  @Roles(Role.ADMIN, Role.AGENT)
  async approveClaim(
    @Param('id', ParseMongoIdPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.transactionsService.approveClaim(id, user);
  }

  @Patch(':id/reject-claim')
  @Roles(Role.ADMIN, Role.AGENT)
  async rejectClaim(
    @Param('id', ParseMongoIdPipe) id: string,
    @CurrentUser() user: IJwtPayload,
  ) {
    return this.transactionsService.rejectClaim(id, user);
  }
}
