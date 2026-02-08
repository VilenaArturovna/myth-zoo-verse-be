import { QueryHandler } from '@nestjs/cqrs';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import {
  GetMyReportsDaoModel,
  GetMyReportsReadDao,
} from '@modules/reports/database/read-model';
import { GetMyReportsQuery } from './get-my-reports.query';

@QueryHandler(GetMyReportsQuery)
export class GetMyReportsQueryHandler {
  constructor(private readonly readDao: GetMyReportsReadDao) {}

  async execute(
    query: GetMyReportsQuery,
  ): Promise<Result<GetMyReportsDaoModel[], ExceptionBase>> {
    return this.readDao.query(query);
  }
}
