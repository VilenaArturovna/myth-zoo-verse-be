import { ZooTables } from '@libs/tables';
import {
  BiomeBuildingModel,
  BiomeBuildingOrmEntityProps,
} from './biome-building.orm-entity';

export class BiomeBuildingObjectionOrmEntity extends BiomeBuildingModel {
  static tableName = ZooTables.biomeBuildings;

  static create(props: BiomeBuildingOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'cost', 'imageKey', 'effect', 'biomeId'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        name: { type: 'string' },
        cost: { type: 'string' },
        imageKey: { type: 'string' },
        effect: { type: 'object' },
        biomeId: { type: 'string' },
      },
    };
  }
}
