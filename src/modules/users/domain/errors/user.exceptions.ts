import { ExceptionBase } from '@libs/base-classes';
import { ExceptionCodes } from '@libs/exceptions';

export class UserHasEmptyFieldsError extends ExceptionBase {
  public readonly code = ExceptionCodes.VALIDATION;

  constructor(message = 'User entity has empty fields') {
    super(message);
  }
}
