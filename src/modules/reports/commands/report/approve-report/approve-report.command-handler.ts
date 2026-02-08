import { CommandHandler } from '@nestjs/cqrs';
import { ApproveReportCommand } from './approve-report.command';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import { CommandHandlerBase } from '@libs/base-classes/command-handler.base';
import { ReportsUnitOfWork } from '@modules/reports/database/unit-of-work';
import { ReportEntity } from '@modules/reports/domain';
import { UuidVO } from '@libs/value-objects';

@CommandHandler(ApproveReportCommand)
export class ApproveReportCommandHandler extends CommandHandlerBase<
  ReportsUnitOfWork,
  ReportEntity
> {
  constructor(unitOfWork: ReportsUnitOfWork) {
    super(unitOfWork);
  }

  async handle(
    command: ApproveReportCommand,
  ): Promise<Result<ReportEntity, ExceptionBase>> {
    const { trxId, payload } = command;

    const repository = this.unitOfWork.getReportRepository(trxId);

    const reportResult = await repository.getOneById(new UuidVO(payload.id));
    const report = reportResult.unwrap();

    report.approve();

    // TODO add statistics
    // TODO plus total stitches
    // TODO plus essence

    return repository.update(report);
  }
}
