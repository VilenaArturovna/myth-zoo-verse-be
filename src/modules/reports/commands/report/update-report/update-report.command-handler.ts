import { CommandHandler } from '@nestjs/cqrs';
import { UpdateReportCommand } from './update-report.command';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import { CommandHandlerBase } from '@libs/base-classes/command-handler.base';
import { ReportsUnitOfWork } from '@modules/reports/database/unit-of-work';
import { S3VO, UuidVO } from '@libs/value-objects';
import { ReportEntity, StitchesVO } from '@modules/reports/domain';

@CommandHandler(UpdateReportCommand)
export class UpdateReportCommandHandler extends CommandHandlerBase<
  ReportsUnitOfWork,
  ReportEntity
> {
  constructor(unitOfWork: ReportsUnitOfWork) {
    super(unitOfWork);
  }

  async handle(
    command: UpdateReportCommand,
  ): Promise<Result<ReportEntity, ExceptionBase>> {
    const { trxId, payload } = command;

    const repository = this.unitOfWork.getReportRepository(trxId);

    const reportResult = await repository.getOneById(new UuidVO(payload.id));
    const report = reportResult.unwrap();

    report.checkIsMyReport(new UuidVO(payload.userId));
    report.checkCanUpdate();

    report.update({
      userComment: payload.userComment,
      startPhotoKey: new S3VO(payload.startPhotoKey),
      finishPhotoKey: new S3VO(payload.finishPhotoKey),
      sagaScreenshotKey: payload.sagaScreenshotKey
        ? new S3VO(payload.sagaScreenshotKey)
        : undefined,
      stitchesRaw: new StitchesVO({
        crosses: payload.crosses || 0,
        halfCrosses: payload.halfCrosses || 0,
        petits: payload.petits || 0,
        beads: payload.beads || 0,
      }),
    });

    return repository.update(report);
  }
}
