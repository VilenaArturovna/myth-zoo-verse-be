import { CommandHandler } from '@nestjs/cqrs';
import { CreateReportCommand } from './create-report.command';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import { CommandHandlerBase } from '@libs/base-classes/command-handler.base';
import { ReportsUnitOfWork } from '@modules/reports/database/unit-of-work';
import { ReportEntity } from '@modules/reports/domain';
import { UuidVO } from '@libs/value-objects';
import { ConflictException } from '@libs/exceptions';

@CommandHandler(CreateReportCommand)
export class CreateReportCommandHandler extends CommandHandlerBase<
  ReportsUnitOfWork,
  ReportEntity
> {
  constructor(unitOfWork: ReportsUnitOfWork) {
    super(unitOfWork);
  }

  async handle(
    command: CreateReportCommand,
  ): Promise<Result<ReportEntity, ExceptionBase>> {
    const {
      trxId,
      payload: { userId },
    } = command;

    const reportRepository = this.unitOfWork.getReportRepository(trxId);
    const codeWordRepository = this.unitOfWork.getCodeWordRepository(trxId);

    const lastReportResult = await reportRepository.getLastByUser(
      new UuidVO(userId),
    );
    const lastReport = lastReportResult.unwrap();

    if (lastReport && lastReport.isDraft) {
      return Result.fail(new ConflictException('У Вас уже есть кодовое слово'));
    }

    const codeWordResult = await codeWordRepository.getRandom(
      lastReport?.codeWordId,
    );
    const codeWord = codeWordResult.unwrap();

    const report = ReportEntity.create({
      userId: new UuidVO(userId),
      codeWord,
    });

    return reportRepository.create(report);
  }
}
