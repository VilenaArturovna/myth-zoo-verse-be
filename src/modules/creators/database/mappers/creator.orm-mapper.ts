import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import { CreatorEntity, CreatorEntityProps } from '@modules/creators/domain';
import { CreatorOrmEntity, CreatorOrmEntityProps } from '../entities';
import { UuidVO } from '@libs/value-objects';

export class CreatorOrmMapper extends OrmMapper<
  CreatorEntity,
  CreatorEntityProps,
  CreatorOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<CreatorEntityProps>): CreatorEntity;
  } {
    return CreatorEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: CreatorOrmEntityProps): CreatorOrmEntity;
  } {
    return CreatorOrmEntity;
  }

  protected toDomainProps(ormEntity: CreatorOrmEntity): CreatorEntityProps {
    return {
      essence: ormEntity.essence,
      userId: new UuidVO(ormEntity.userId),
      eggStorageCapacity: ormEntity.eggStorageCapacity,
    };
  }

  protected toOrmProps(
    entity: CreatorEntity,
  ): OrmEntityProps<CreatorOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      essence: props.essence,
      userId: props.userId.value,
      eggStorageCapacity: props.eggStorageCapacity,
    };
  }
}
