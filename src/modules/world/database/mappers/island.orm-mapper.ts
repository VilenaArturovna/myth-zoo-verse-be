import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import { IslandEntity, IslandEntityProps } from '@modules/world/domain';
import { IslandOrmEntity, IslandOrmEntityProps } from '../entities';
import { IslandLevelOrmMapper } from '@modules/world/database/mappers/island-level.orm-mapper';

export class IslandOrmMapper extends OrmMapper<
  IslandEntity,
  IslandEntityProps,
  IslandOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<IslandEntityProps>): IslandEntity;
  } {
    return IslandEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: IslandOrmEntityProps): IslandOrmEntity;
  } {
    return IslandOrmEntity;
  }

  protected toDomainProps(ormEntity: IslandOrmEntity): IslandEntityProps {
    return {
      biomesCount: ormEntity.biomesCount,
      cost: ormEntity.cost,
      order: ormEntity.order,
      levels: ormEntity.levels.map((level) =>
        new IslandLevelOrmMapper().toDomainEntity(level),
      ),
    };
  }

  protected toOrmProps(entity: IslandEntity): OrmEntityProps<IslandOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      cost: props.cost,
      order: props.order,
      biomesCount: props.biomesCount,
      levels: props.levels.map((level) =>
        new IslandLevelOrmMapper(entity.id).toOrmEntity(level),
      ),
    };
  }
}
