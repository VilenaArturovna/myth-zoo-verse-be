import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import {
  BiomeBuildingEntity,
  BiomeBuildingEntityProps,
} from '@modules/world/domain';
import {
  BiomeBuildingObjectionOrmEntity,
  BiomeBuildingOrmEntity,
} from '../entities';
import { BiomeBuildingOrmMapper } from '../mappers';

export class BiomeBuildingObjectionRepository extends ObjectionRepositoryBase<
  BiomeBuildingEntity,
  BiomeBuildingEntityProps,
  BiomeBuildingOrmEntity,
  BiomeBuildingObjectionOrmEntity,
  BiomeBuildingOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(
      BiomeBuildingObjectionOrmEntity,
      new BiomeBuildingOrmMapper(),
      unitOfWork,
      trxId,
    );
  }
}
