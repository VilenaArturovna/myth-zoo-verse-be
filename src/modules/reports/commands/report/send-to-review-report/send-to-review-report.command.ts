import { CommandBase } from '@libs/base-classes';
import { SendToReviewReportRequestDto } from './send-to-review-report.request.dto';

export class SendToReviewReportCommand extends CommandBase<
  SendToReviewReportRequestDto & { id: string; userId: string }
> {}
