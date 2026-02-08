import { CommandHandler } from '@nestjs/cqrs';
import { DisableWordCommand } from './disable-word.command';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import { CommandHandlerBase } from '@libs/base-classes/command-handler.base';
import { ReportsUnitOfWork } from '@modules/reports/database/unit-of-work';
import { CodeWordEntity } from '@modules/reports/domain';

@CommandHandler(DisableWordCommand)
export class DisableWordCommandHandler extends CommandHandlerBase<
  ReportsUnitOfWork,
  CodeWordEntity
> {
  constructor(unitOfWork: ReportsUnitOfWork) {
    super(unitOfWork);
  }

  async handle(
    command: DisableWordCommand,
  ): Promise<Result<CodeWordEntity, ExceptionBase>> {
    const { trxId, payload } = command;

    const repository = this.unitOfWork.getCodeWordRepository(trxId);

    const codeWordResult = await repository.getOneByWord(payload.word);
    const codeWord = codeWordResult.unwrap();

    codeWord.disable();

    return repository.update(codeWord);
  }
}
