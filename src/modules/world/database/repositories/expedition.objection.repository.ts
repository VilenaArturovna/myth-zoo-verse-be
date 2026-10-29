import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { ExpeditionEntity, ExpeditionEntityProps } from '@modules/world/domain';
import { ExpeditionObjectionOrmEntity, ExpeditionOrmEntity } from '../entities';
import { ExpeditionOrmMapper } from '../mappers';

export class ExpeditionObjectionRepository extends ObjectionRepositoryBase<
  ExpeditionEntity,
  ExpeditionEntityProps,
  ExpeditionOrmEntity,
  ExpeditionObjectionOrmEntity,
  ExpeditionOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(
      ExpeditionObjectionOrmEntity,
      new ExpeditionOrmMapper(),
      unitOfWork,
      trxId,
    );
  }
}
