import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import {
  BiomeBuildingEntity,
  BiomeBuildingEntityProps,
  EffectVO,
} from '@modules/world/domain';
import {
  BiomeBuildingOrmEntity,
  BiomeBuildingOrmEntityProps,
} from '../entities';
import { IdVO, S3VO } from '@libs/value-objects';

export class BiomeBuildingOrmMapper extends OrmMapper<
  BiomeBuildingEntity,
  BiomeBuildingEntityProps,
  BiomeBuildingOrmEntity
> {
  private biomeId: IdVO;

  constructor(biomeId?: IdVO) {
    super();
    this.biomeId = biomeId;
  }

  protected getEntityConstructor(): {
    new (
      props: CreateEntityProps<BiomeBuildingEntityProps>,
    ): BiomeBuildingEntity;
  } {
    return BiomeBuildingEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: BiomeBuildingOrmEntityProps): BiomeBuildingOrmEntity;
  } {
    return BiomeBuildingOrmEntity;
  }

  protected toDomainProps(
    ormEntity: BiomeBuildingOrmEntity,
  ): BiomeBuildingEntityProps {
    return {
      cost: ormEntity.cost,
      name: ormEntity.name,
      imageKey: new S3VO(ormEntity.imageKey),
      effect: new EffectVO(ormEntity.effect),
    };
  }

  protected toOrmProps(
    entity: BiomeBuildingEntity,
  ): OrmEntityProps<BiomeBuildingOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      cost: props.cost,
      name: props.name,
      imageKey: props.imageKey.value,
      effect: EffectVO.toJSON(props.effect),
      biomeId: this.biomeId.value,
    };
  }
}
