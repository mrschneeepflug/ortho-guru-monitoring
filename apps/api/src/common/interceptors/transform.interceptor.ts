import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface TransformedResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If already wrapped, return as-is
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }
        return { data };
      }),
    );
  }
}
