import { ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { Model } from 'objection';

import {
  GetNextReportDaoModel,
  GetNextReportReadDao,
} from './get-next-report.read.dao';
import { GetNextReportQuery } from '@modules/reports/queries';
import { Tables } from '@libs/tables';
import { NotFoundException } from '@libs/exceptions';
import { ReportStatus } from '@modules/reports/types';

export class GetNextReportObjectionReadDao extends GetNextReportReadDao {
  async query(
    query: GetNextReportQuery,
  ): Promise<Result<GetNextReportDaoModel, ExceptionBase>> {
    const knex = Model.knex();

    const qb = knex
      .from(`${Tables.reports} as r`)
      .select(
        'r.id',
        'r.createdAt',
        'w.word as codeWord',
        'r.startPhotoKey',
        'r.finishPhotoKey',
        'r.sagaScreenshotKey',
        'r.userComment',
        'r.stitchesNormalized',
        'r.reviewerId',
        knex.raw(`("stitchesRaw"->>'crosses')::int as crosses`),
        knex.raw(`("stitchesRaw"->>'halfCrosses')::int as "halfCrosses"`),
        knex.raw(`("stitchesRaw"->>'petits')::int as petits`),
        knex.raw(`("stitchesRaw"->>'beads')::int as beads`),
      )
      .innerJoin(`${Tables.codeWords} as w`, 'r.codeWordId', 'w.id')
      .where({ status: ReportStatus.pending })
      .andWhere(function () {
        this.whereNull('r.skipReviewerId').orWhere(
          'r.skipReviewerId',
          '<>',
          query.params.reviewerId,
        );
      })
      .orderBy('r.updatedAt', 'asc');

    const reports = await qb;

    if (!reports.length) {
      return Result.fail(new NotFoundException('Нет отчетов для проверки'));
    }

    const currentReport = reports.find(
      (r) => r.reviewerId === query.params.reviewerId,
    );

    return Result.ok(currentReport ?? reports[0]);
  }
}
