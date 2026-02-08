import {
  DisableWordCommandHandler,
  DisableWordController,
} from '@modules/reports/commands/code-word';
import {
  AddStartPhotoCommandHandler,
  AddStartPhotoController,
  ApproveReportCommandHandler,
  ApproveReportController,
  CreateReportCommandHandler,
  CreateReportController,
  RejectReportCommandHandler,
  RejectReportController,
  ReviewReportCommandHandler,
  ReviewReportController,
  SendToReviewReportCommandHandler,
  SendToReviewReportController,
  SkipReportCommandHandler,
  SkipReportController,
  UpdateReportCommandHandler,
  UpdateReportController,
} from '@modules/reports/commands/report';

export const commandControllers = [
  DisableWordController,
  CreateReportController,
  SendToReviewReportController,
  AddStartPhotoController,
  UpdateReportController,
  ReviewReportController,
  SkipReportController,
  RejectReportController,
  ApproveReportController,
];
export const commandHandlers = [
  DisableWordCommandHandler,
  CreateReportCommandHandler,
  SendToReviewReportCommandHandler,
  AddStartPhotoCommandHandler,
  UpdateReportCommandHandler,
  ReviewReportCommandHandler,
  SkipReportCommandHandler,
  RejectReportCommandHandler,
  ApproveReportCommandHandler,
];
