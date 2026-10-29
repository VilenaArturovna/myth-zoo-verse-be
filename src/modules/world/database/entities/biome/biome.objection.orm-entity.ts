import { ZooTables } from '@libs/tables';
import { BiomeModel, BiomeOrmEntityProps } from './biome.orm-entity';
import { Model, RelationMappings } from 'objection';
import { BiomeBuildingObjectionOrmEntity } from '../biome-building/biome-building.objection.orm-entity';
import { CreatureObjectionOrmEntity } from '../creature/creature.objection.orm-entity';
import { EggObjectionOrmEntity } from '../egg/egg.objection.orm-entity';

export class BiomeObjectionOrmEntity extends BiomeModel {
  static tableName = ZooTables.biomes;

  static create(props: BiomeOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    };
  }

  static relationMappings: RelationMappings = {
    building: {
      relation: Model.HasOneRelation,
      modelClass: BiomeBuildingObjectionOrmEntity,
      join: {
        from: `${this.tableName}.id`,
        to: `${BiomeBuildingObjectionOrmEntity.tableName}.biomeId`,
      },
    },
    eggs: {
      relation: Model.HasManyRelation,
      modelClass: EggObjectionOrmEntity,
      join: {
        from: `${this.tableName}.id`,
        to: `${EggObjectionOrmEntity.tableName}.biomeId`,
      },
    },
    creatures: {
      relation: Model.HasManyRelation,
      modelClass: CreatureObjectionOrmEntity,
      join: {
        from: `${this.tableName}.id`,
        to: `${CreatureObjectionOrmEntity.tableName}.biomeId`,
      },
    },
  };
}
