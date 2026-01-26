import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import { UserEntity, UserEntityProps } from '@modules/users/domain';
import { UserOrmEntity, UserOrmEntityProps } from '../entities';
import { HashVO, UrlVO } from '@libs/value-objects';

export class UserOrmMapper extends OrmMapper<
  UserEntity,
  UserEntityProps,
  UserOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<UserEntityProps>): UserEntity;
  } {
    return UserEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: UserOrmEntityProps): UserOrmEntity;
  } {
    return UserOrmEntity;
  }

  protected toDomainProps(ormEntity: UserOrmEntity): UserEntityProps {
    return {
      username: ormEntity.username,
      totalStitches: ormEntity.totalStitches,
      crystals: ormEntity.crystals,
      role: ormEntity.role,
      tgId: ormEntity.tgId,
      photoUrl: ormEntity.photoUrl ? new UrlVO(ormEntity.photoUrl) : null,
      refreshTokenHash: ormEntity.refreshTokenHash
        ? new HashVO(ormEntity.refreshTokenHash)
        : null,
    };
  }

  protected toOrmProps(entity: UserEntity): OrmEntityProps<UserOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      role: props.role,
      username: props.username,
      tgId: props.tgId,
      crystals: props.crystals,
      totalStitches: props.totalStitches,
      photoUrl: props.photoUrl ? props.photoUrl.value : null,
      refreshTokenHash: props.refreshTokenHash
        ? props.refreshTokenHash.value
        : null,
    };
  }
}
