import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import { EggEntity, EggEntityProps, RangeVO } from '@modules/world/domain';
import { EggOrmEntity, EggOrmEntityProps } from '../entities';
import { IdVO, S3VO } from '@libs/value-objects';

export class EggOrmMapper extends OrmMapper<
  EggEntity,
  EggEntityProps,
  EggOrmEntity
> {
  private biomeId: IdVO;

  constructor(biomeId?: IdVO) {
    super();
    this.biomeId = biomeId;
  }

  protected getEntityConstructor(): {
    new (props: CreateEntityProps<EggEntityProps>): EggEntity;
  } {
    return EggEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: EggOrmEntityProps): EggOrmEntity;
  } {
    return EggOrmEntity;
  }

  protected toDomainProps(ormEntity: EggOrmEntity): EggEntityProps {
    return {
      type: ormEntity.type,
      imageKey: new S3VO(ormEntity.imageKey),
      cost: new RangeVO(ormEntity.cost),
      duration: new RangeVO(ormEntity.duration),
    };
  }

  protected toOrmProps(entity: EggEntity): OrmEntityProps<EggOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      type: props.type,
      imageKey: props.imageKey.value,
      cost: RangeVO.toJSON(props.cost),
      duration: RangeVO.toJSON(props.duration),
      biomeId: this.biomeId?.value,
    };
  }
}
