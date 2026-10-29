import { ZooTables } from '@libs/tables';
import {
  ExpeditionModel,
  ExpeditionOrmEntityProps,
} from './expedition.orm-entity';

export class ExpeditionObjectionOrmEntity extends ExpeditionModel {
  static tableName = ZooTables.expeditions;

  static create(props: ExpeditionOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['cost', 'duration', 'level'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        level: { type: 'number' },
        cost: { type: 'object' },
        duration: { type: 'object' },
      },
    };
  }
}
