import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import {
  ExpeditionEntity,
  ExpeditionEntityProps,
  RangeVO,
} from '@modules/world/domain';
import { ExpeditionOrmEntity, ExpeditionOrmEntityProps } from '../entities';

export class ExpeditionOrmMapper extends OrmMapper<
  ExpeditionEntity,
  ExpeditionEntityProps,
  ExpeditionOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<ExpeditionEntityProps>): ExpeditionEntity;
  } {
    return ExpeditionEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: ExpeditionOrmEntityProps): ExpeditionOrmEntity;
  } {
    return ExpeditionOrmEntity;
  }

  protected toDomainProps(
    ormEntity: ExpeditionOrmEntity,
  ): ExpeditionEntityProps {
    return {
      cost: new RangeVO(ormEntity.cost),
      duration: new RangeVO(ormEntity.duration),
      level: ormEntity.level,
    };
  }

  protected toOrmProps(
    entity: ExpeditionEntity,
  ): OrmEntityProps<ExpeditionOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      cost: RangeVO.toJSON(props.cost),
      duration: RangeVO.toJSON(props.duration),
      level: props.level,
    };
  }
}
