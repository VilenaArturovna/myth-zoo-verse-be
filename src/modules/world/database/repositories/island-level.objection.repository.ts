import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import {
  IslandLevelEntity,
  IslandLevelEntityProps,
} from '@modules/world/domain';
import {
  IslandLevelObjectionOrmEntity,
  IslandLevelOrmEntity,
} from '../entities';
import { IslandLevelOrmMapper } from '../mappers';

export class IslandLevelObjectionRepository extends ObjectionRepositoryBase<
  IslandLevelEntity,
  IslandLevelEntityProps,
  IslandLevelOrmEntity,
  IslandLevelObjectionOrmEntity,
  IslandLevelOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(
      IslandLevelObjectionOrmEntity,
      new IslandLevelOrmMapper(),
      unitOfWork,
      trxId,
    );
  }
}
