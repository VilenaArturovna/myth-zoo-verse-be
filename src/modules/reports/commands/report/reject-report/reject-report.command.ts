import { CommandBase } from '@libs/base-classes';
import { RejectReportRequestDto } from './reject-report.request.dto';

export class RejectReportCommand extends CommandBase<
  RejectReportRequestDto & { id: string }
> {}
