import { ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { Model } from 'objection';

import {
  GetApprovedReportsDaoModel,
  GetApprovedReportsReadDao,
} from './get-approved-reports.read.dao';
import { GetApprovedReportsQuery } from '@modules/reports/queries';
import { Tables } from '@libs/tables';
import { ReportStatus } from '@modules/reports/types';
import { paginate } from '@libs/pagination';

export class GetApprovedReportsObjectionReadDao extends GetApprovedReportsReadDao {
  async query(
    query: GetApprovedReportsQuery,
  ): Promise<Result<GetApprovedReportsDaoModel, ExceptionBase>> {
    const knex = Model.knex();

    const qb = knex
      .from(`${Tables.reports} as r`)
      .select(
        'r.id',
        'r.createdAt',
        'r.approvedAt',
        'u.username',
        'rev.username' as 'reviewerUsername',
        'r.startPhotoKey',
        'r.finishPhotoKey',
        'r.stitchesNormalized',
        'w.word as codeWord',
      )
      .innerJoin(`${Tables.codeWords} as w`, 'r.codeWordId', 'w.id')
      .innerJoin(`${Tables.users} as u`, 'r.userId', 'u.id')
      .innerJoin(`${Tables.users} as rev`, 'r.userId', 'rev.id')
      .where('r.status', ReportStatus.approved)
      .where('r.deleteAt', '>', 'now()')
      .orderBy('r.approvedAt', 'desc');

    return paginate({
      qb,
      page: query.params.page,
      limit: query.params.limit,
      isGrouped: false,
    });
  }
}
