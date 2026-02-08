import { Provider } from '@nestjs/common';

import { GetApprovedReportsObjectionReadDao } from './get-approved-reports.objection.read.dao';
import { GetApprovedReportsReadDao } from './get-approved-reports.read.dao';

export const GetApprovedReportsReadDaoProvider: Provider<GetApprovedReportsReadDao> =
  {
    provide: GetApprovedReportsReadDao,
    useClass: GetApprovedReportsObjectionReadDao,
  };
