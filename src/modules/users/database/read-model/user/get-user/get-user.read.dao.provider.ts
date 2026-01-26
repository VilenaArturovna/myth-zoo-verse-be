import { Provider } from '@nestjs/common';

import { GetUserObjectionReadDao } from './get-user.objection.read.dao';
import { GetUserReadDao } from './get-user.read.dao';

export const GetUserReadDaoProvider: Provider<GetUserReadDao> = {
  provide: GetUserReadDao,
  useClass: GetUserObjectionReadDao,
};
