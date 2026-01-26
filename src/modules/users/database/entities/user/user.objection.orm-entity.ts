import { Tables } from '@libs/tables';
import { UserModel, UserOrmEntityProps } from './user.orm-entity';

export class UserObjectionOrmEntity extends UserModel {
  static tableName = Tables.users;

  static create(props: UserOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'tgId', 'crystals', 'totalStitches', 'role'],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        username: { type: 'string' },
        tgId: { type: 'string' },
        crystals: { type: 'number' },
        totalStitches: { type: 'number' },
        role: { type: 'string' },
        photoUrl: { type: ['string', 'null'] },
        refreshTokenHash: { type: ['string', 'null'] },
      },
    };
  }
}
