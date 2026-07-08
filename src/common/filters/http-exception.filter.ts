import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse();

      if (typeof resBody === 'object' && resBody !== null) {
        const responseBody = resBody as { message?: unknown; errors?: unknown };
        // If NestJS validation error, responseBody.message is an array of strings
        if (Array.isArray(responseBody.message)) {
          message = 'Validation failed';
          errors = responseBody.message;
        } else {
          message =
            typeof responseBody.message === 'string'
              ? responseBody.message
              : exception.message;
          if (
            responseBody.errors !== undefined &&
            responseBody.errors !== null
          ) {
            errors = Array.isArray(responseBody.errors)
              ? responseBody.errors
              : [responseBody.errors];
          }
        }
      } else if (typeof resBody === 'string') {
        message = resBody;
      }
    } else if (exception instanceof Error && exception.name === 'MulterError') {
      const multerError = exception as { code?: string; message?: string };
      if (multerError.code === 'LIMIT_FILE_SIZE') {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = 'File size is too large. Maximum limit is 5MB.';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = multerError.message || 'File upload error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      status: 'error',
      message,
      errors,
    });
  }
}
