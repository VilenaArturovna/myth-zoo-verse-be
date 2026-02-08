import { ExceptionBase, ReadDaoBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { ApiProperty } from '@nestjs/swagger';

import { GetApprovedReportsQuery } from '@modules/reports/queries';
import { PaginationResponseDto } from '@libs/pagination';

export class GetApprovedReportsItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  approvedAt: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  reviewerName: string;

  @ApiProperty()
  startPhotoKey: string;

  @ApiProperty()
  finishPhotoKey: string;

  @ApiProperty()
  stitchesNormalized: number;

  @ApiProperty()
  codeWord: string;
}

export class GetApprovedReportsDaoModel extends PaginationResponseDto<GetApprovedReportsItem> {
  @ApiProperty({ type: () => GetApprovedReportsItem, isArray: true })
  data: GetApprovedReportsItem[];
}

export abstract class GetApprovedReportsReadDao extends ReadDaoBase<
  GetApprovedReportsDaoModel,
  GetApprovedReportsQuery
> {
  abstract query(
    query: GetApprovedReportsQuery,
  ): Promise<Result<GetApprovedReportsDaoModel, ExceptionBase>>;
}
