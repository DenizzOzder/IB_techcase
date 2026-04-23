import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map(data => {
        // Mongoose document'ları plain object'e çevir ve __v vs. gizle
        const transformedData = instanceToPlain(data, {
          excludeExtraneousValues: false,
          enableImplicitConversion: true,
        });

        // Emlak Danışmanı vs. için genel standart sarmalayıcı
        return {
          statusCode: response.statusCode,
          data: transformedData,
        };
      })
    );
  }
}
