import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
  async getStats(@Query('period') period: 'monthly' | 'yearly' = 'monthly') {
    return this.statsService.getStats(period === 'yearly' ? 'yearly' : 'monthly');
  }
}
