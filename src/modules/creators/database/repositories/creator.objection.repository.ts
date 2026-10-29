import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { CreatorEntity, CreatorEntityProps } from '@modules/creators/domain';
import { CreatorObjectionOrmEntity, CreatorOrmEntity } from '../entities';
import { CreatorOrmMapper } from '../mappers';

export class CreatorObjectionRepository extends ObjectionRepositoryBase<
  CreatorEntity,
  CreatorEntityProps,
  CreatorOrmEntity,
  CreatorObjectionOrmEntity,
  CreatorOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(CreatorObjectionOrmEntity, new CreatorOrmMapper(), unitOfWork, trxId);
  }
}
