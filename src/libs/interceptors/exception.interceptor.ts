import {
  CallHandler,
  ExecutionContext,
  LoggerService,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable } from 'rxjs';
import { exceptionMapper } from '../exceptions/exception.mapper';

export class ExceptionInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    return next
      .handle()
      .pipe(catchError((err) => exceptionMapper(err, this.logger)));
  }
}
