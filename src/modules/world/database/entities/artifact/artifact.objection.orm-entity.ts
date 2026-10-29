import { ZooTables } from '@libs/tables';
import { ArtifactModel, ArtifactOrmEntityProps } from './artifact.orm-entity';

export class ArtifactObjectionOrmEntity extends ArtifactModel {
  static tableName = ZooTables.artifacts;

  static create(props: ArtifactOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'imageKey', 'type', 'effect'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        name: { type: 'string' },
        imageKey: { type: 'string' },
        type: { type: 'string' },
        effect: { type: 'object' },
      },
    };
  }
}
