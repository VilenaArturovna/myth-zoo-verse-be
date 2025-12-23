import { ExceptionBase } from '@libs/base-classes';
import { ExceptionCodes } from './exception.codes';

export class NotFoundException extends ExceptionBase {
  readonly code = ExceptionCodes.NOT_FOUND;
}
