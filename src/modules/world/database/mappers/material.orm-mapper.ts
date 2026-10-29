import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import { MaterialEntity, MaterialEntityProps } from '@modules/world/domain';
import { MaterialOrmEntity, MaterialOrmEntityProps } from '../entities';
import { S3VO } from '@libs/value-objects';

export class MaterialOrmMapper extends OrmMapper<
  MaterialEntity,
  MaterialEntityProps,
  MaterialOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<MaterialEntityProps>): MaterialEntity;
  } {
    return MaterialEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: MaterialOrmEntityProps): MaterialOrmEntity;
  } {
    return MaterialOrmEntity;
  }

  protected toDomainProps(ormEntity: MaterialOrmEntity): MaterialEntityProps {
    return {
      imageKey: new S3VO(ormEntity.imageKey),
      code: ormEntity.code,
      name: ormEntity.name,
    };
  }

  protected toOrmProps(
    entity: MaterialEntity,
  ): OrmEntityProps<MaterialOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      code: props.code,
      name: props.name,
      imageKey: props.imageKey.value,
    };
  }
}
