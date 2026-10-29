import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import {
  ArtifactEntity,
  ArtifactEntityProps,
  EffectVO,
} from '@modules/world/domain';
import { ArtifactOrmEntity, ArtifactOrmEntityProps } from '../entities';
import { S3VO } from '@libs/value-objects';

export class ArtifactOrmMapper extends OrmMapper<
  ArtifactEntity,
  ArtifactEntityProps,
  ArtifactOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<ArtifactEntityProps>): ArtifactEntity;
  } {
    return ArtifactEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: ArtifactOrmEntityProps): ArtifactOrmEntity;
  } {
    return ArtifactOrmEntity;
  }

  protected toDomainProps(ormEntity: ArtifactOrmEntity): ArtifactEntityProps {
    return {
      type: ormEntity.type,
      name: ormEntity.name,
      imageKey: new S3VO(ormEntity.imageKey),
      effect: new EffectVO(ormEntity.effect),
    };
  }

  protected toOrmProps(
    entity: ArtifactEntity,
  ): OrmEntityProps<ArtifactOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      type: props.type,
      name: props.name,
      imageKey: props.imageKey.value,
      effect: EffectVO.toJSON(props.effect),
    };
  }
}
