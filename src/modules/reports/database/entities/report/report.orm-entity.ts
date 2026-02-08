import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { ReportStatus } from '@modules/reports/types';
import { StitchesProps } from '@modules/reports/domain';
import {
  CodeWordOrmEntity,
  CodeWordOrmEntityProps,
} from '@modules/reports/database/entities';

export interface ReportOrmEntityProps {
  codeWordId: string;
  userId: string;
  startPhotoKey?: string;
  finishPhotoKey?: string;
  sagaScreenshotKey?: string;
  userComment?: string;
  reviewerComment?: string;
  status: ReportStatus;
  reviewerId?: string;
  stitchesNormalized: number;
  stitchesRaw: StitchesProps;
  codeWord?: CodeWordOrmEntityProps;
  reviewExpiresAt?: string;
  skipReviewerId?: string;
  deleteAt?: string;
  approvedAt?: string;
}

export class ReportOrmEntity
  extends OrmEntityBase<ReportOrmEntityProps>
  implements ReportOrmEntityProps
{
  codeWordId: string;
  userId: string;
  startPhotoKey?: string;
  finishPhotoKey?: string;
  sagaScreenshotKey?: string;
  userComment?: string;
  reviewerComment?: string;
  status: ReportStatus;
  reviewerId?: string;
  stitchesNormalized: number;
  stitchesRaw: StitchesProps;
  codeWord?: CodeWordOrmEntity;
  reviewExpiresAt?: string;
  skipReviewerId?: string;
  deleteAt?: string;
  approvedAt?: string;
}

export class ReportModel extends ModelBase implements ReportOrmEntity {
  codeWordId: string;
  userId: string;
  startPhotoKey?: string;
  finishPhotoKey?: string;
  sagaScreenshotKey?: string;
  userComment?: string;
  reviewerComment?: string;
  status: ReportStatus;
  reviewerId?: string;
  stitchesNormalized: number;
  stitchesRaw: StitchesProps;
  codeWord?: CodeWordOrmEntity;
  reviewExpiresAt?: string;
  skipReviewerId?: string;
  deleteAt?: string;
  approvedAt?: string;
}
