import { ZooTables } from '@libs/tables';
import { MaterialModel, MaterialOrmEntityProps } from './material.orm-entity';

export class MaterialObjectionOrmEntity extends MaterialModel {
  static tableName = ZooTables.materials;

  static create(props: MaterialOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['imageKey', 'name', 'code'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        imageKey: { type: 'string' },
        code: { type: 'string' },
        name: { type: 'string' },
      },
    };
  }
}
