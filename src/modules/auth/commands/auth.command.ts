import { CommandHandlerBase } from '@libs/base-classes/command-handler.base';
import { CommandBase, ExceptionBase } from '@libs/base-classes';
import { UnitOfWorkObjection } from '@libs/unit-of-work';
import { Result } from '@libs/utils';
import { CommandHandler } from '@nestjs/cqrs';
import { AuthRepository } from '../database/auth.repository';
import { Injectable } from '@nestjs/common';

export type AuthAction =
  | 'register'
  | 'requestToken'
  | 'consumeToken'
  | 'login'
  | 'startTelegramAttempt'
  | 'completeTelegramAttempt'
  | 'refresh'
  | 'logout';
export class AuthCommand extends CommandBase<{
  action: AuthAction;
  args: any[];
}> {}
@Injectable()
export class AuthUnitOfWork extends UnitOfWorkObjection {
  repository(id: string) {
    return new AuthRepository(this.getTrx(id));
  }
}
@CommandHandler(AuthCommand)
export class AuthCommandHandler extends CommandHandlerBase<
  AuthUnitOfWork,
  any
> {
  constructor(unitOfWork: AuthUnitOfWork) {
    super(unitOfWork);
  }
  async handle(command: AuthCommand): Promise<Result<any, ExceptionBase>> {
    try {
      const repo = this.unitOfWork.repository(command.trxId);
      const action = repo[command.payload.action].bind(repo) as (
        ...args: any[]
      ) => Promise<any>;
      return Result.ok(await action(...command.payload.args));
    } catch (error) {
      return Result.fail(error);
    }
  }
}
