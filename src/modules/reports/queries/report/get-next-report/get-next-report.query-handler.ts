import { QueryHandler } from '@nestjs/cqrs';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import {
  GetNextReportDaoModel,
  GetNextReportReadDao,
} from '@modules/reports/database/read-model';
import { GetNextReportQuery } from './get-next-report.query';

@QueryHandler(GetNextReportQuery)
export class GetNextReportQueryHandler {
  constructor(private readonly readDao: GetNextReportReadDao) {}

  async execute(
    query: GetNextReportQuery,
  ): Promise<Result<GetNextReportDaoModel, ExceptionBase>> {
    return this.readDao.query(query);
  }
}
