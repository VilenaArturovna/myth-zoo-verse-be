import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { CreatureEntity, CreatureEntityProps } from '@modules/world/domain';
import { CreatureObjectionOrmEntity, CreatureOrmEntity } from '../entities';
import { CreatureOrmMapper } from '../mappers';

export class CreatureObjectionRepository extends ObjectionRepositoryBase<
  CreatureEntity,
  CreatureEntityProps,
  CreatureOrmEntity,
  CreatureObjectionOrmEntity,
  CreatureOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(
      CreatureObjectionOrmEntity,
      new CreatureOrmMapper(),
      unitOfWork,
      trxId,
    );
  }
}
