import { ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { Model } from 'objection';

import {
  GetMyReportsDaoModel,
  GetMyReportsReadDao,
} from './get-my-reports.read.dao';
import { GetMyReportsQuery } from '@modules/reports/queries';
import { Tables } from '@libs/tables';

export class GetMyReportsObjectionReadDao extends GetMyReportsReadDao {
  async query(
    query: GetMyReportsQuery,
  ): Promise<Result<GetMyReportsDaoModel[], ExceptionBase>> {
    const knex = Model.knex();

    const qb = knex
      .from(`${Tables.reports} as r`)
      .select('r.id', 'w.word as codeWord', 'r.status', 'r.stitchesNormalized')
      .innerJoin(`${Tables.codeWords} as w`, 'r.codeWordId', 'w.id')
      .where({ userId: query.params.userId })
      .andWhere('r.deleteAt', '>', 'now()')
      .orderBy('r.createdAt', 'desc');

    return Result.ok(await qb);
  }
}
