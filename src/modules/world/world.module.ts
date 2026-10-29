import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorldUnitOfWork } from '@modules/world/database';

@Module({
  exports: [],
  providers: [WorldUnitOfWork],
  controllers: [],
  imports: [CqrsModule],
})
export class WorldModule {}
