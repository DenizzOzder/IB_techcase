import { Controller, Post, Body, UseGuards, Get, Delete, Param } from '@nestjs/common';
import { UsersService } from '@/modules/Users/usersService';
import { Roles } from '@/Common/Decorators/rolesDecorator';
import { Role } from '@repo/types';
import { RolesGuard } from '@/Common/Guards/rolesGuard';
import { JwtAuthGuard } from '@/Common/Guards/jwtAuthGuard';
import { RegisterAgentDto } from '@/modules/Users/Dtos/registerAgentDto';
import { ParseMongoIdPipe } from '@/Common/Pipes/parseMongoIdPipe';
import { CurrentUser } from '@/Common/Decorators/currentUserDecorator';
import type { IJwtPayload } from '@repo/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('agent')
  @Roles(Role.ADMIN)
  async createAgent(@Body() body: RegisterAgentDto) {
    const user = await this.usersService.createAgent(body);
    return {
      message: 'Danışman başarıyla oluşturuldu.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  @Get('agents')
  @Roles(Role.ADMIN)
  async getAgents() {
    return this.usersService.findAllAgents();
  }

  @Delete('agents/:id')
  @Roles(Role.ADMIN)
  async deactivateAgent(@Param('id', ParseMongoIdPipe) id: string) {
    await this.usersService.deactivateAgent(id);
    return { message: 'Danışman başarıyla pasife alındı.' };
  }

  @Get('agents/:id/stats')
  @Roles(Role.ADMIN)
  async getAgentStats(@Param('id', ParseMongoIdPipe) id: string) {
    return this.usersService.getAgentStats(id);
  }

  @Get('me/stats')
  @Roles(Role.AGENT, Role.ADMIN)
  async getMyStats(@CurrentUser() user: IJwtPayload) {
    return this.usersService.getAgentStats(user.sub);
  }
}

