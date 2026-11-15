import { NotFoundException } from '@libs/exceptions';
import { ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { Model } from 'objection';

import { GetUserDaoModel, GetUserReadDao } from './get-user.read.dao';
import { GetUserQuery } from '@modules/users/queries';
import { CoreTables } from '@libs/tables';

export class GetUserObjectionReadDao extends GetUserReadDao {
  async query(
    query: GetUserQuery,
  ): Promise<Result<GetUserDaoModel, ExceptionBase>> {
    const knex = Model.knex();

    const qb = knex
      .from(CoreTables.users)
      .select(
        'id',
        'username',
        'createdAt',
        'photoUrl',
        'totalStitches',
        'crystals',
        'role',
      )
      .where('id', query.params.id)
      .first();

    const user = await qb;
    return user
      ? Result.ok(user)
      : Result.fail(new NotFoundException('Пользователь не найден'));
  }
}
