import { ZooTables } from '@libs/tables';
import {
  IslandLevelModel,
  IslandLevelOrmEntityProps,
} from './island-level.orm-entity';

export class IslandLevelObjectionOrmEntity extends IslandLevelModel {
  static tableName = ZooTables.islandLevels;

  static create(props: IslandLevelOrmEntityProps) {
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
        islandId: { type: 'string' },
        condition: { type: 'object' },
        possibility: { type: 'object' },
        order: { type: 'number' },
      },
    };
  }
}
