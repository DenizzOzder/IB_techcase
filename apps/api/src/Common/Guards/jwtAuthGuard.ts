/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IJwtPayload } from '@repo/types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = IJwtPayload>(err: any, user: any, _info: any): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException('Oturum süresi dolmuş veya geçersiz token.')
      );
    }
    return user as TUser;
  }
}
