import { Provider } from '@nestjs/common';

import { GetOneReportObjectionReadDao } from './get-one-report.objection.read.dao';
import { GetOneReportReadDao } from './get-one-report.read.dao';

export const GetOneReportReadDaoProvider: Provider<GetOneReportReadDao> = {
  provide: GetOneReportReadDao,
  useClass: GetOneReportObjectionReadDao,
};
