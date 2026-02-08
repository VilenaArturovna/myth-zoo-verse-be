import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReportsUnitOfWork } from '@modules/reports/database/unit-of-work';
import { commandControllers, commandHandlers } from '@modules/reports/commands';
import { queryControllers, queryHandlers } from '@modules/reports/queries';
import { readDaoProviders } from '@modules/reports/database';

@Module({
  imports: [CqrsModule],
  exports: [],
  providers: [
    ReportsUnitOfWork,
    ...commandHandlers,
    ...queryHandlers,
    ...readDaoProviders,
  ],
  controllers: [...commandControllers, ...queryControllers],
})
export class ReportsModule {}
