import { CommandBase } from '@libs/base-classes';

export class ReviewReportCommand extends CommandBase<{
  id: string;
  reviewerId: string;
}> {}
