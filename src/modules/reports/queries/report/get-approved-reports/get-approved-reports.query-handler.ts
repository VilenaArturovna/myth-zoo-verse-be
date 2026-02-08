import { QueryHandler } from '@nestjs/cqrs';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import {
  GetApprovedReportsDaoModel,
  GetApprovedReportsReadDao,
} from '@modules/reports/database/read-model';
import { GetApprovedReportsQuery } from './get-approved-reports.query';

@QueryHandler(GetApprovedReportsQuery)
export class GetApprovedReportsQueryHandler {
  constructor(private readonly readDao: GetApprovedReportsReadDao) {}

  async execute(
    query: GetApprovedReportsQuery,
  ): Promise<Result<GetApprovedReportsDaoModel, ExceptionBase>> {
    return this.readDao.query(query);
  }
}
