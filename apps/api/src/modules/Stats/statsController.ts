import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { StatsService } from '@/modules/Stats/statsService';
import { JwtAuthGuard } from '@/Common/Guards/jwtAuthGuard';
import { RolesGuard } from '@/Common/Guards/rolesGuard';
import { Roles } from '@/Common/Decorators/rolesDecorator';
import { Role } from '@repo/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /** GET /admin/stats?period=monthly|yearly */
  @Get()
  @Roles(Role.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  async getStats(@Query('period') period: 'monthly' | 'yearly' = 'monthly') {
    return this.statsService.getStats(
      period === 'yearly' ? 'yearly' : 'monthly',
    );
  }
}
