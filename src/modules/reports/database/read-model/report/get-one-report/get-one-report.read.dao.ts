import { ReadDaoBase, ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { GetOneReportQuery } from '@modules/reports/queries';
import { ReportStatus } from '@modules/reports/types';

export class GetOneReportDaoModel {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  approvedAt: string;

  @ApiProperty()
  codeWord: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ nullable: true })
  startPhotoKey?: string;

  @ApiPropertyOptional({ nullable: true })
  finishPhotoKey?: string;

  @ApiPropertyOptional({ nullable: true })
  sagaScreenshotKey?: string;

  @ApiPropertyOptional({ nullable: true })
  userComment?: string;

  @ApiPropertyOptional({ nullable: true })
  reviewerComment?: string;

  @ApiProperty({ enum: ReportStatus, enumName: 'ReportStatus' })
  status: ReportStatus;

  @ApiPropertyOptional({ nullable: true })
  reviewerId?: string;

  @ApiPropertyOptional({ nullable: true })
  reviewerUsername?: string;

  @ApiProperty()
  stitchesNormalized: number;

  @ApiPropertyOptional({ nullable: true })
  crosses?: number;

  @ApiPropertyOptional({ nullable: true })
  halfCrosses?: number;

  @ApiPropertyOptional({ nullable: true })
  petits?: number;

  @ApiPropertyOptional({ nullable: true })
  beads?: number;
}

export abstract class GetOneReportReadDao extends ReadDaoBase<
  GetOneReportDaoModel,
  GetOneReportQuery
> {
  abstract query(
    query: GetOneReportQuery,
  ): Promise<Result<GetOneReportDaoModel, ExceptionBase>>;
}
