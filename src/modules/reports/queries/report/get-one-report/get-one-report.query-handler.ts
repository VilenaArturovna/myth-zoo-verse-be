import { QueryHandler } from '@nestjs/cqrs';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import {
  GetOneReportDaoModel,
  GetOneReportReadDao,
} from '@modules/reports/database/read-model';
import { GetOneReportQuery } from './get-one-report.query';

@QueryHandler(GetOneReportQuery)
export class GetOneReportQueryHandler {
  constructor(private readonly readDao: GetOneReportReadDao) {}

  async execute(
    query: GetOneReportQuery,
  ): Promise<Result<GetOneReportDaoModel, ExceptionBase>> {
    // TODO map s3 key to url with s3 service

    return this.readDao.query(query);
  }
}
