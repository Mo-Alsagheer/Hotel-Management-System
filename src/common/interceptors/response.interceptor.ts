import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SUCCESS_MESSAGE_KEY } from '../decorators/success-message.decorator';

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
  constructor(private readonly reflector: Reflector) {}

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

        // Retrieve success message from metadata
        const metadataMessage = this.reflector.get<string>(
          SUCCESS_MESSAGE_KEY,
          context.getHandler(),
        );

        const message = metadataMessage || 'Operation successful';

        return {
          status: 'success',
          message,
          data: (data === undefined ? null : data) as T,
        };
      }),
    );
  }
}
