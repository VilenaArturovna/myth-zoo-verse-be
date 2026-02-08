import { Provider } from '@nestjs/common';

import { GetNextReportObjectionReadDao } from './get-next-report.objection.read.dao';
import { GetNextReportReadDao } from './get-next-report.read.dao';

export const GetNextReportReadDaoProvider: Provider<GetNextReportReadDao> = {
  provide: GetNextReportReadDao,
  useClass: GetNextReportObjectionReadDao,
};
