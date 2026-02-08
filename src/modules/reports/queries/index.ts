import {
  GetApprovedReportsController,
  GetApprovedReportsQueryHandler,
  GetMyReportsController,
  GetMyReportsQueryHandler,
  GetNextReportController,
  GetNextReportQueryHandler,
  GetOneReportController,
  GetOneReportQueryHandler,
} from '@modules/reports/queries/report';

export * from './report';

export const queryControllers = [
  GetApprovedReportsController,
  GetMyReportsController,
  GetNextReportController,
  GetOneReportController,
];
export const queryHandlers = [
  GetOneReportQueryHandler,
  GetApprovedReportsQueryHandler,
  GetMyReportsQueryHandler,
  GetNextReportQueryHandler,
];
