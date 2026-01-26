import { ExceptionBase, ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { UserEntity, UserEntityProps } from '@modules/users/domain';
import { UserObjectionOrmEntity, UserOrmEntity } from '../entities';
import { UserOrmMapper } from '../mappers';
import { Result } from '@libs/utils';
import { NotFoundException } from '@libs/exceptions';

export class UserObjectionRepository extends ObjectionRepositoryBase<
  UserEntity,
  UserEntityProps,
  UserOrmEntity,
  UserObjectionOrmEntity,
  UserOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(UserObjectionOrmEntity, new UserOrmMapper(), unitOfWork, trxId);
  }

  async getOneByTgId(tgId: string): Promise<Result<UserEntity, ExceptionBase>> {
    try {
      const ormEntity = await this.repository.query().findOne('tgId', tgId);

      if (!ormEntity) {
        return Result.fail(new NotFoundException('User not found'));
      }

      const domainEntity = this.mapper.toDomainEntity(ormEntity);

      return Result.ok(domainEntity);
    } catch (e) {
      return Result.fail(e);
    }
  }
}
