import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AuditLogsService } from '@/modules/AuditLogs/auditLogsService';
import { JwtAuthGuard } from '@/Common/Guards/jwtAuthGuard';
import { RolesGuard } from '@/Common/Guards/rolesGuard';
import { Roles } from '@/Common/Decorators/rolesDecorator';
import { Role } from '@repo/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  async getLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('timeRange') timeRange?: string
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.auditLogsService.getLogs(
      isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
      isNaN(limitNum) || limitNum < 1 ? 20 : limitNum,
      timeRange
    );
  }
}
