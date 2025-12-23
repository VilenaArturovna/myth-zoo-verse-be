import { ExceptionBase } from '@libs/base-classes';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { ExceptionCodes } from './exception.codes';

export const exceptionMapper = (ex: ExceptionBase, logger: LoggerService) => {
  logger.error(ex);

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

  throw ex;
};
