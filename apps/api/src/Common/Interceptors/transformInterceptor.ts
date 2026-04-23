import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';
import type { Response } from 'express';

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // Mongoose objeleri ve aggregation ObjectId'lerini string'e çevirmek için JSON stringify trick
        const safeData = JSON.parse(JSON.stringify(data));
        const transformedData = instanceToPlain(safeData, {
          excludeExtraneousValues: false,
          enableImplicitConversion: true,
        }) as T;

        // Emlak Danışmanı vs. için genel standart sarmalayıcı
        return {
          statusCode: response.statusCode,
          data: transformedData,
        };
      }),
    );
  }
}
