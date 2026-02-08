import { Provider } from '@nestjs/common';

import { GetMyReportsObjectionReadDao } from './get-my-reports.objection.read.dao';
import { GetMyReportsReadDao } from './get-my-reports.read.dao';

export const GetMyReportsReadDaoProvider: Provider<GetMyReportsReadDao> = {
  provide: GetMyReportsReadDao,
  useClass: GetMyReportsObjectionReadDao,
};
