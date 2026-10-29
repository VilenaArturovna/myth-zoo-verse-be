import { ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { Model } from 'objection';

import {
  GetApprovedReportsDaoModel,
  GetApprovedReportsReadDao,
} from './get-approved-reports.read.dao';
import { GetApprovedReportsQuery } from '@modules/reports/queries';
import { CoreTables } from '@libs/tables';
import { ReportStatus } from '@modules/reports/types';
import { paginate } from '@libs/pagination';

export class GetApprovedReportsObjectionReadDao extends GetApprovedReportsReadDao {
  async query(
    query: GetApprovedReportsQuery,
  ): Promise<Result<GetApprovedReportsDaoModel, ExceptionBase>> {
    const knex = Model.knex();

    const qb = knex
      .from(`${CoreTables.reports} as r`)
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
      .innerJoin(`${CoreTables.codeWords} as w`, 'r.codeWordId', 'w.id')
      .innerJoin(`${CoreTables.users} as u`, 'r.userId', 'u.id')
      .innerJoin(`${CoreTables.users} as rev`, 'r.userId', 'rev.id')
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
