import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomRequest } from '../interfaces/request.interface';

export interface ResponseEnvelope<T> {
  status: string;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((data: unknown): ResponseEnvelope<T> => {
        // If data is already in the final format, don't double wrap
        if (
          data &&
          typeof data === 'object' &&
          'status' in data &&
          'data' in data
        ) {
          return data as ResponseEnvelope<T>;
        }

        const request = context.switchToHttp().getRequest<CustomRequest>();
        const message = request.successMessage || 'Operation successful';

        return {
          status: 'success',
          message,
          data: (data === undefined ? null : data) as T,
        };
      }),
    );
  }
}
