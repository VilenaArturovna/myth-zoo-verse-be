import { ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { Model } from 'objection';

import { GetUserDaoModel, GetUserReadDao } from './get-user.read.dao';
import { GetUserQuery } from '@modules/users/queries';
import { Tables } from '@libs/tables';

export class GetUserObjectionReadDao extends GetUserReadDao {
  async query(
    query: GetUserQuery,
  ): Promise<Result<GetUserDaoModel, ExceptionBase>> {
    const knex = Model.knex();

    const qb = knex
      .from(Tables.users)
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

    if (query.params.withRefreshTokenHash) {
      qb.select('refreshTokenHash');
    }

    return Result.ok(await qb);
  }
}
