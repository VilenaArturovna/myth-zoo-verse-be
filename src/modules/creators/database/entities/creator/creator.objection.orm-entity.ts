import { ZooTables } from '@libs/tables';
import { CreatorModel, CreatorOrmEntityProps } from './creator.orm-entity';
import { Model, RelationMappings } from 'objection';
import { UserObjectionOrmEntity } from '@modules/users/database/entities';

export class CreatorObjectionOrmEntity extends CreatorModel {
  static tableName = ZooTables.creators;

  static create(props: CreatorOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'essence', 'eggStorageCapacity'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        userId: { type: 'string' },
        essence: { type: 'number' },
        eggStorageCapacity: { type: 'number' },
      },
    };
  }

  static relationMappings: RelationMappings = {
    user: {
      relation: Model.HasOneRelation,
      modelClass: UserObjectionOrmEntity,
      join: {
        from: `${this.tableName}.userId`,
        to: `${UserObjectionOrmEntity.tableName}.id`,
      },
    },
  };
}
