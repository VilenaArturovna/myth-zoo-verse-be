import {
  GetApprovedReportsReadDaoProvider,
  GetMyReportsReadDaoProvider,
  GetNextReportReadDaoProvider,
  GetOneReportReadDaoProvider,
} from '@modules/reports/database/read-model/report';

export const readDaoProviders = [
  GetOneReportReadDaoProvider,
  GetApprovedReportsReadDaoProvider,
  GetMyReportsReadDaoProvider,
  GetNextReportReadDaoProvider,
];
