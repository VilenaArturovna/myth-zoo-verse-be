import { ZooTables } from '@libs/tables';
import { EggModel, EggOrmEntityProps } from './egg.orm-entity';
import { RangeProps, RarityType } from '@modules/world/domain';

export class EggObjectionOrmEntity extends EggModel {
  static tableName = ZooTables.eggs;

  static create(props: EggOrmEntityProps) {
    return this.fromJson(props);
  }

  type: RarityType;
  imageKey: string;
  cost: RangeProps;
  duration: RangeProps;

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['cost', 'imageKey', 'duration', 'type', 'biomeId'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        type: { type: 'string' },
        imageKey: { type: 'string' },
        cost: { type: 'object' },
        duration: { type: 'object' },
        biomeId: { type: 'string' },
      },
    };
  }
}
