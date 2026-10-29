import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { MaterialEntity, MaterialEntityProps } from '@modules/world/domain';
import { MaterialObjectionOrmEntity, MaterialOrmEntity } from '../entities';
import { MaterialOrmMapper } from '../mappers';

export class MaterialObjectionRepository extends ObjectionRepositoryBase<
  MaterialEntity,
  MaterialEntityProps,
  MaterialOrmEntity,
  MaterialObjectionOrmEntity,
  MaterialOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(
      MaterialObjectionOrmEntity,
      new MaterialOrmMapper(),
      unitOfWork,
      trxId,
    );
  }
}
