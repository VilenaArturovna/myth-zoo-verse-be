import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import {
  ConditionVO,
  IslandLevelEntity,
  IslandLevelEntityProps,
  PossibilityVO,
} from '@modules/world/domain';
import { IslandLevelOrmEntity, IslandLevelOrmEntityProps } from '../entities';
import { IdVO } from '@libs/value-objects';

export class IslandLevelOrmMapper extends OrmMapper<
  IslandLevelEntity,
  IslandLevelEntityProps,
  IslandLevelOrmEntity
> {
  private islandId: IdVO;

  constructor(islandId?: IdVO) {
    super();
    this.islandId = islandId;
  }
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<IslandLevelEntityProps>): IslandLevelEntity;
  } {
    return IslandLevelEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: IslandLevelOrmEntityProps): IslandLevelOrmEntity;
  } {
    return IslandLevelOrmEntity;
  }

  protected toDomainProps(
    ormEntity: IslandLevelOrmEntity,
  ): IslandLevelEntityProps {
    return {
      possibility: new PossibilityVO(ormEntity.possibility),
      condition: new ConditionVO(ormEntity.condition),
      order: ormEntity.order,
    };
  }

  protected toOrmProps(
    entity: IslandLevelEntity,
  ): OrmEntityProps<IslandLevelOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      condition: ConditionVO.toJSON(props.condition),
      possibility: PossibilityVO.toJSON(props.possibility),
      islandId: this.islandId.value,
      order: props.order,
    };
  }
}
