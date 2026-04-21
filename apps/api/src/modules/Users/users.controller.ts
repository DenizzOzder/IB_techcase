import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@repo/types';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegisterAgentDto } from './dto/register-agent.dto';

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
