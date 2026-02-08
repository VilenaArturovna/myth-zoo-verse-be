import { ReadDaoBase, ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { ApiProperty } from '@nestjs/swagger';

import { GetMyReportsQuery } from '@modules/reports/queries';
import { ReportStatus } from '@modules/reports/types';

export class GetMyReportsDaoModel {
  @ApiProperty()
  id: string;

  @ApiProperty({ enumName: 'ReportStatus', enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty()
  codeWord: string;

  @ApiProperty()
  stitchesNormalized: number;
}

export abstract class GetMyReportsReadDao extends ReadDaoBase<
  GetMyReportsDaoModel[],
  GetMyReportsQuery
> {
  abstract query(
    query: GetMyReportsQuery,
  ): Promise<Result<GetMyReportsDaoModel[], ExceptionBase>>;
}
