import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@modules/reports/types';
import { ReportEntity } from '@modules/reports/domain';

export class ReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  codeWord: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  startPhotoUrl?: string;

  @ApiPropertyOptional({ nullable: true })
  finishPhotoUrl?: string;

  @ApiPropertyOptional({ nullable: true })
  sagaScreenshotUrl?: string;

  @ApiPropertyOptional({ nullable: true })
  userComment?: string;

  @ApiPropertyOptional({ nullable: true })
  reviewerComment?: string;

  @ApiProperty({ enum: ReportStatus, enumName: 'ReportStatus' })
  status: ReportStatus;

  @ApiPropertyOptional({ nullable: true })
  reviewerId?: string;

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

  constructor(entity: ReportEntity) {
    const props = entity.getCopiedProps();
    this.id = props.id.value;
    this.createdAt = props.createdAt.ISOString;
    this.updatedAt = props.updatedAt.ISOString;

    this.codeWord = props.codeWord.word;
    this.userId = props.userId.value;

    //TODO add generating url
    this.startPhotoUrl = props.startPhotoKey?.value;
    this.finishPhotoUrl = props.finishPhotoKey?.value;
    this.sagaScreenshotUrl = props.sagaScreenshotKey?.value;
    this.userComment = props.userComment;
    this.reviewerComment = props.reviewerComment;
    this.status = props.status;
    this.reviewerId = props.reviewerId?.value;

    this.stitchesNormalized = props.stitchesNormalized;
    this.crosses = props.stitchesRaw.crosses;
    this.halfCrosses = props.stitchesRaw.halfCrosses;
    this.petits = props.stitchesRaw.petits;
    this.beads = props.stitchesRaw.beads;
  }
}
