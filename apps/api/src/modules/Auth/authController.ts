import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '@/modules/Auth/authService';
import { LoginDto } from '@/modules/Auth/Dtos/loginDto';
import { JwtAuthGuard } from '@/Common/Guards/jwtAuthGuard';
import { CurrentUser } from '@/Common/Decorators/currentUserDecorator';
import type { IJwtPayload } from '@repo/types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: IJwtPayload) {
    await this.authService.logout(user.sub);
    return { message: 'Çıkış yapıldı.' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshTokens(@Body() body: { userId: string, refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }
}
