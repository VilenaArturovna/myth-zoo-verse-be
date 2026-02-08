import { CommandBase } from '@libs/base-classes';
import { UpdateReportRequestDto } from './update-report.request.dto';

export class UpdateReportCommand extends CommandBase<
  UpdateReportRequestDto & { id: string; userId: string }
> {}
