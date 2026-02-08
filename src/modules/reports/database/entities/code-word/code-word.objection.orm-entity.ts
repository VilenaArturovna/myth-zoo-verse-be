import { Tables } from '@libs/tables';
import { CodeWordModel, CodeWordOrmEntityProps } from './code-word.orm-entity';

export class CodeWordObjectionOrmEntity extends CodeWordModel {
  static tableName = Tables.codeWords;

  static create(props: CodeWordOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['value'],
      properties: {
        id: { type: 'string' },
        word: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    };
  }
}
