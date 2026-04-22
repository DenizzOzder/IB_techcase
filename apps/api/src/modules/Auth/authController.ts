import { Controller, Post, Body, Res, Req, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@/modules/Auth/authService';
import { LoginDto } from '@/modules/Auth/Dtos/loginDto';
import type { Response, Request } from 'express';

/**
 * Güvenlik Politikası — httpOnly Cookie Pattern:
 *   - Login → accessToken response body'de döner (Pinia'da memory'de tutulur)
 *             refreshToken httpOnly cookie olarak set edilir (JS erişemez → XSS koruması)
 *   - Refresh → Cookie'deki refreshToken okunur, yeni accessToken döner, cookie güncellenir
 *   - Logout → Cookie temizlenir, DB'deki hashedRefreshToken null'a çekilir
 */

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  // Production'da true olmalı (HTTPS zorunlu). Dev'de false bırakılır.
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün (ms cinsinden)
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Refresh token'ı httpOnly cookie'ye yaz — JavaScript erişemez
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    // Yalnızca accessToken + user bilgisi döner (refreshToken body'de gelmiyor)
    return { accessToken: result.accessToken, user: result.user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }

    const result = await this.authService.refreshTokensByToken(refreshToken);

    // Yeni refresh token cookie'yi güncelle (rotasyon)
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return { accessToken: result.accessToken, user: result.user };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refreshToken'];
    if (refreshToken) {
      try {
        // Token geçerliyse DB'deki hashedRefreshToken'ı temizle
        const result = await this.authService.refreshTokensByToken(refreshToken);
        await this.authService.logout(result.user._id);
      } catch {
        // Token süresi dolmuş olabilir, yine de cookie'yi temizle
      }
    }
    // httpOnly cookie'yi her halükarda sil
    res.clearCookie('refreshToken', { path: '/' });
    return { message: 'Çıkış yapıldı.' };
  }
}
