import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { IslandEntity, IslandEntityProps } from '@modules/world/domain';
import { IslandObjectionOrmEntity, IslandOrmEntity } from '../entities';
import { IslandOrmMapper } from '../mappers';

export class IslandObjectionRepository extends ObjectionRepositoryBase<
  IslandEntity,
  IslandEntityProps,
  IslandOrmEntity,
  IslandObjectionOrmEntity,
  IslandOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(IslandObjectionOrmEntity, new IslandOrmMapper(), unitOfWork, trxId);
  }
}
