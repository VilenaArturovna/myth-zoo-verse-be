import { ExceptionBase } from '@libs/base-classes';
import { ExceptionCodes } from '@libs/exceptions/exception.codes';

export class BadRequestException extends ExceptionBase {
  readonly code = ExceptionCodes.BAD_REQUEST;
}
