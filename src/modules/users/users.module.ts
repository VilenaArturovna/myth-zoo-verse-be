import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersUnitOfWork } from '@modules/users/database/unit-of-work';
import { queryControllers, queryHandlers } from '@modules/users/queries';
import { readDaoProviders } from '@modules/users/database';
import { GetUserReadDao } from '@modules/users/database/read-model';

@Module({
  imports: [CqrsModule],
  exports: [GetUserReadDao, UsersUnitOfWork],
  providers: [UsersUnitOfWork, ...readDaoProviders, ...queryHandlers],
  controllers: [...queryControllers],
})
export class UsersModule {}
