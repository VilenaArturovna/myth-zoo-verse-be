import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import {
  CreatureEntity,
  CreatureEntityProps,
  EffectVO,
} from '@modules/world/domain';
import { CreatureOrmEntity, CreatureOrmEntityProps } from '../entities';
import { IdVO, S3VO } from '@libs/value-objects';

export class CreatureOrmMapper extends OrmMapper<
  CreatureEntity,
  CreatureEntityProps,
  CreatureOrmEntity
> {
  private biomeId: IdVO;

  constructor(biomeId?: IdVO) {
    super();
    this.biomeId = biomeId;
  }

  protected getEntityConstructor(): {
    new (props: CreateEntityProps<CreatureEntityProps>): CreatureEntity;
  } {
    return CreatureEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: CreatureOrmEntityProps): CreatureOrmEntity;
  } {
    return CreatureOrmEntity;
  }

  protected toDomainProps(ormEntity: CreatureOrmEntity): CreatureEntityProps {
    return {
      type: ormEntity.type,
      name: ormEntity.name,
      imageKey: new S3VO(ormEntity.imageKey),
      effect: new EffectVO(ormEntity.effect),
    };
  }

  protected toOrmProps(
    entity: CreatureEntity,
  ): OrmEntityProps<CreatureOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      type: props.type,
      name: props.name,
      imageKey: props.imageKey.value,
      effect: EffectVO.toJSON(props.effect),
      biomeId: this.biomeId.value,
    };
  }
}
