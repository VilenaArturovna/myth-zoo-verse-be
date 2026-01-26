import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserUnitOfWork } from '@modules/users/database/unit-of-work';
import { queryControllers, queryHandlers } from '@modules/users/queries';
import { readDaoProviders } from '@modules/users/database';
import { GetUserReadDao } from '@modules/users/database/read-model';

@Module({
  imports: [CqrsModule],
  exports: [GetUserReadDao, UserUnitOfWork],
  providers: [UserUnitOfWork, ...readDaoProviders, ...queryHandlers],
  controllers: [...queryControllers],
})
export class UserModule {}
