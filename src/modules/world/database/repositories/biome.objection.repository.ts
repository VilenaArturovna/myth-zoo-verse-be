import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { BiomeEntity, BiomeEntityProps } from '@modules/world/domain';
import { BiomeObjectionOrmEntity, BiomeOrmEntity } from '../entities';
import { BiomeOrmMapper } from '../mappers';

export class BiomeObjectionRepository extends ObjectionRepositoryBase<
  BiomeEntity,
  BiomeEntityProps,
  BiomeOrmEntity,
  BiomeObjectionOrmEntity,
  BiomeOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(BiomeObjectionOrmEntity, new BiomeOrmMapper(), unitOfWork, trxId);
  }
}
