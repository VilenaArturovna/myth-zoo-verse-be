import { CommandHandler } from '@nestjs/cqrs';
import { AddStartPhotoCommand } from './add-start-photo.command';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import { CommandHandlerBase } from '@libs/base-classes/command-handler.base';
import { ReportsUnitOfWork } from '@modules/reports/database/unit-of-work';
import { ReportEntity } from '@modules/reports/domain';
import { S3VO, UuidVO } from '@libs/value-objects';

@CommandHandler(AddStartPhotoCommand)
export class AddStartPhotoCommandHandler extends CommandHandlerBase<
  ReportsUnitOfWork,
  ReportEntity
> {
  constructor(unitOfWork: ReportsUnitOfWork) {
    super(unitOfWork);
  }

  async handle(
    command: AddStartPhotoCommand,
  ): Promise<Result<ReportEntity, ExceptionBase>> {
    const { trxId, payload } = command;

    const repository = this.unitOfWork.getReportRepository(trxId);

    const reportResult = await repository.getOneById(new UuidVO(payload.id));
    const report = reportResult.unwrap();

    report.checkIsMyReport(new UuidVO(payload.userId));
    report.addStartPhoto(new S3VO(payload.startPhotoKey));

    return repository.update(report);
  }
}
