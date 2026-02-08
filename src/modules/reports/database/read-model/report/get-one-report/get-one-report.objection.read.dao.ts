import { ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { Model } from 'objection';

import {
  GetOneReportDaoModel,
  GetOneReportReadDao,
} from './get-one-report.read.dao';
import { GetOneReportQuery } from '@modules/reports/queries';
import { Tables } from '@libs/tables';
import { NotFoundException } from '@libs/exceptions';

export class GetOneReportObjectionReadDao extends GetOneReportReadDao {
  async query(
    query: GetOneReportQuery,
  ): Promise<Result<GetOneReportDaoModel, ExceptionBase>> {
    const knex = Model.knex();

    const qb = knex
      .from(`${Tables.reports} as r`)
      .select(
        'r.id',
        'r.createdAt',
        'r.updatedAt',
        'r.approvedAt',
        'r.userId',
        'u.username',
        'w.word as codeWord',
        'r.startPhotoKey',
        'r.finishPhotoKey',
        'r.sagaScreenshotKey',
        'r.userComment',
        'r.reviewerComment',
        'r.status',
        'r.stitchesNormalized',
        'r.reviewerId',
        'rev.username' as 'reviewerUsername',
        knex.raw(`("stitchesRaw"->>'crosses')::int as crosses`),
        knex.raw(`("stitchesRaw"->>'halfCrosses')::int as "halfCrosses"`),
        knex.raw(`("stitchesRaw"->>'petits')::int as petits`),
        knex.raw(`("stitchesRaw"->>'beads')::int as beads`),
      )
      .innerJoin(`${Tables.codeWords} as w`, 'r.codeWordId', 'w.id')
      .innerJoin(`${Tables.users} as u`, 'r.userId', 'u.id')
      .leftJoin(`${Tables.users} as rev`, 'r.userId', 'rev.id')
      .where('r.id', query.params.id)
      .whereNull('r.deleteAt')
      .first();

    const report = await qb;

    if (!report) {
      return Result.fail(new NotFoundException('Отчет не найден'));
    }

    return Result.ok(report);
  }
}
