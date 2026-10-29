import { ZooTables } from '@libs/tables';
import { IslandModel, IslandOrmEntityProps } from './island.orm-entity';
import { Model, RelationMappings } from 'objection';
import { IslandLevelObjectionOrmEntity } from '../island-level/island-level.objection.orm-entity';

export class IslandObjectionOrmEntity extends IslandModel {
  static tableName = ZooTables.islands;

  static create(props: IslandOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['biomesCount', 'cost'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        biomesCount: { type: 'number' },
        cost: { type: 'number' },
        order: { type: ['number', 'null'] },
      },
    };
  }

  static relationMappings: RelationMappings = {
    levels: {
      relation: Model.HasManyRelation,
      modelClass: IslandLevelObjectionOrmEntity,
      join: {
        from: `${this.tableName}.id`,
        to: `${IslandLevelObjectionOrmEntity.tableName}.islandId`,
      },
    },
  };
}
