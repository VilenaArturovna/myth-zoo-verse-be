import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { EggEntity, EggEntityProps } from '@modules/world/domain';
import { EggObjectionOrmEntity, EggOrmEntity } from '../entities';
import { EggOrmMapper } from '../mappers';

export class EggObjectionRepository extends ObjectionRepositoryBase<
  EggEntity,
  EggEntityProps,
  EggOrmEntity,
  EggObjectionOrmEntity,
  EggOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(EggObjectionOrmEntity, new EggOrmMapper(), unitOfWork, trxId);
  }
}
