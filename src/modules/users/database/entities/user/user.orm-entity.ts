import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { Role } from '@modules/users/types';

export interface UserOrmEntityProps {
  tgId: string;
  username: string;
  photoUrl?: string;
  totalStitches: number;
  crystals: number;
  role: Role;
  refreshTokenHash?: string;
}

export class UserOrmEntity
  extends OrmEntityBase<UserOrmEntityProps>
  implements UserOrmEntityProps
{
  crystals: number;
  photoUrl?: string;
  role: Role;
  tgId: string;
  totalStitches: number;
  username: string;
  refreshTokenHash?: string;
}

export class UserModel extends ModelBase implements UserOrmEntity {
  crystals: number;
  photoUrl?: string;
  role: Role;
  tgId: string;
  totalStitches: number;
  username: string;
  refreshTokenHash?: string;
}
