import { ExceptionBase } from '@libs/base-classes';
import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  ConflictException,
  ForbiddenException,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { ExceptionCodes } from './exception.codes';

export const exceptionMapper = (ex: ExceptionBase, logger: LoggerService) => {
  // Errors may contain SQL bindings, SMTP bodies or credentials.
  logger.error({
    event: 'request_failed',
    type: ex?.constructor?.name ?? 'Error',
  });

  if (ex.toJSON) {
    const exception = ex.toJSON();
    switch (exception.code) {
      case ExceptionCodes.CONFLICT:
        throw new ConflictException(exception.message);

      case ExceptionCodes.FORBIDDEN:
        throw new ForbiddenException(exception.message);

      case ExceptionCodes.NOT_FOUND:
        throw new NotFoundException(exception.message);

      case ExceptionCodes.VALIDATION:
        throw new BadRequestException(exception.message);

      case ExceptionCodes.BAD_REQUEST:
        throw new BadRequestException(exception.message);
      default:
        break;
    }
  }

  if (ex instanceof HttpException) throw ex;
  throw new InternalServerErrorException('Внутренняя ошибка сервера');
};
