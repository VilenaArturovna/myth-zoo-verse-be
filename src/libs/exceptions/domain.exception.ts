import { ExceptionBase } from '@libs/base-classes';
import { ExceptionCodes } from './exception.codes';

export class DomainException extends ExceptionBase {
  readonly code = ExceptionCodes.DOMAIN;
}
