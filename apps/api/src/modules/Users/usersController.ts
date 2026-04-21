import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from '@/modules/Users/usersService';
import { Roles } from '@/Common/Decorators/rolesDecorator';
import { Role } from '@repo/types';
import { RolesGuard } from '@/Common/Guards/rolesGuard';
import { JwtAuthGuard } from '@/Common/Guards/jwtAuthGuard';
import { RegisterAgentDto } from '@/modules/Users/Dtos/registerAgentDto';

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
}
