import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, IJwtPayload } from '@repo/types';
import { ROLES_KEY } from '@/Common/Decorators/rolesDecorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: IJwtPayload }>();

    if (!user) {
      throw new ForbiddenException(
        'Güvenliğiniz için tekrar giriş yapmanız gerekiyor.',
      );
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        'Bu işlemi yapmak için yetkiniz (yönetici/danışman) yeterli değil.',
      );
    }

    return true;
  }
}
