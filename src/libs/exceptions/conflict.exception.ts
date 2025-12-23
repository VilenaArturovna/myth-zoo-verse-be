import { ExceptionBase } from '@libs/base-classes';
import { ExceptionCodes } from './exception.codes';

export class ConflictException extends ExceptionBase {
  readonly code = ExceptionCodes.CONFLICT;
}
