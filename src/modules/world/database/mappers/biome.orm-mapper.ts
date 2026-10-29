import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import { BiomeEntity, BiomeEntityProps } from '@modules/world/domain';
import { BiomeOrmEntity, BiomeOrmEntityProps } from '../entities';
import { S3VO } from '@libs/value-objects';
import { BiomeBuildingOrmMapper } from '@modules/world/database/mappers/biome-building.orm-mapper';
import { EggOrmMapper } from '@modules/world/database/mappers/egg.orm-mapper';
import { CreatureOrmMapper } from '@modules/world/database/mappers/creature.orm-mapper';

export class BiomeOrmMapper extends OrmMapper<
  BiomeEntity,
  BiomeEntityProps,
  BiomeOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<BiomeEntityProps>): BiomeEntity;
  } {
    return BiomeEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: BiomeOrmEntityProps): BiomeOrmEntity;
  } {
    return BiomeOrmEntity;
  }

  protected toDomainProps(ormEntity: BiomeOrmEntity): BiomeEntityProps {
    return {
      code: ormEntity.code,
      cost: ormEntity.cost,
      name: ormEntity.name,
      imageKey: new S3VO(ormEntity.imageKey),
      building: ormEntity.building
        ? new BiomeBuildingOrmMapper().toDomainEntity(ormEntity.building)
        : undefined,
      eggs: ormEntity.eggs
        ? ormEntity.eggs.map((egg) => new EggOrmMapper().toDomainEntity(egg))
        : undefined,
      creatures: ormEntity.creatures
        ? ormEntity.creatures.map((cr) =>
            new CreatureOrmMapper().toDomainEntity(cr),
          )
        : undefined,
    };
  }

  protected toOrmProps(entity: BiomeEntity): OrmEntityProps<BiomeOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      code: props.code,
      name: props.name,
      imageKey: props.imageKey.value,
      cost: props.cost,
      building: props.building
        ? new BiomeBuildingOrmMapper(entity.id).toOrmEntity(props.building)
        : undefined,
      eggs: props.eggs
        ? props.eggs.map((egg) => new EggOrmMapper(entity.id).toOrmEntity(egg))
        : undefined,
      creatures: props.creatures
        ? props.creatures.map((cr) =>
            new CreatureOrmMapper(entity.id).toOrmEntity(cr),
          )
        : undefined,
    };
  }
}
