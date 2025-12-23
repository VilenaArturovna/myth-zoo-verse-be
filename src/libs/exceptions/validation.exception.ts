import { ExceptionBase } from '@libs/base-classes';
import { ExceptionCodes } from './exception.codes';

export class ValidationException extends ExceptionBase {
  readonly code = ExceptionCodes.VALIDATION;
}
