import { ZooTables } from '@libs/tables';
import { CreatureModel, CreatureOrmEntityProps } from './creature.orm-entity';

export class CreatureObjectionOrmEntity extends CreatureModel {
  static tableName = ZooTables.creatures;

  static create(props: CreatureOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'imageKey', 'type', 'effect', 'biomeId'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        name: { type: 'string' },
        imageKey: { type: 'string' },
        type: { type: 'string' },
        effect: { type: 'object' },
        biomeId: { type: 'string' },
      },
    };
  }
}
