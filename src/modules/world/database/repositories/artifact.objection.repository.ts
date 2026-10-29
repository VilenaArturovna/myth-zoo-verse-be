import { ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { ArtifactEntity, ArtifactEntityProps } from '@modules/world/domain';
import { ArtifactObjectionOrmEntity, ArtifactOrmEntity } from '../entities';
import { ArtifactOrmMapper } from '../mappers';

export class ArtifactObjectionRepository extends ObjectionRepositoryBase<
  ArtifactEntity,
  ArtifactEntityProps,
  ArtifactOrmEntity,
  ArtifactObjectionOrmEntity,
  ArtifactOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(
      ArtifactObjectionOrmEntity,
      new ArtifactOrmMapper(),
      unitOfWork,
      trxId,
    );
  }
}
