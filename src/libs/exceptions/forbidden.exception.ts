import { ExceptionBase } from '@libs/base-classes';
import { ExceptionCodes } from './exception.codes';

export class ForbiddenException extends ExceptionBase {
  readonly code = ExceptionCodes.FORBIDDEN;
}
