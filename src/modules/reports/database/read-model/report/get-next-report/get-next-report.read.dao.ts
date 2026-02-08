import { ReadDaoBase, ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { GetNextReportQuery } from '@modules/reports/queries';

export class GetNextReportDaoModel {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  codeWord: string;

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

  @ApiPropertyOptional({ nullable: true })
  startPhotoKey?: string;

  @ApiPropertyOptional({ nullable: true })
  finishPhotoKey?: string;

  @ApiPropertyOptional({ nullable: true })
  sagaScreenshotKey?: string;

  @ApiPropertyOptional({ nullable: true })
  userComment?: string;
}

export abstract class GetNextReportReadDao extends ReadDaoBase<
  GetNextReportDaoModel,
  GetNextReportQuery
> {
  abstract query(
    query: GetNextReportQuery,
  ): Promise<Result<GetNextReportDaoModel, ExceptionBase>>;
}
