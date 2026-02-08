import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import {
  ReportEntity,
  ReportEntityProps,
  StitchesVO,
} from '@modules/reports/domain';
import { ReportOrmEntity, ReportOrmEntityProps } from '../entities';
import { DateVO, S3VO, UuidVO } from '@libs/value-objects';
import { CodeWordOrmMapper } from '@modules/reports/database/mappers/code-word.orm-mapper';

export class ReportOrmMapper extends OrmMapper<
  ReportEntity,
  ReportEntityProps,
  ReportOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<ReportEntityProps>): ReportEntity;
  } {
    return ReportEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: ReportOrmEntityProps): ReportOrmEntity;
  } {
    return ReportOrmEntity;
  }

  protected toDomainProps(ormEntity: ReportOrmEntity): ReportEntityProps {
    return {
      status: ormEntity.status,
      startPhotoKey: ormEntity.startPhotoKey
        ? new S3VO(ormEntity.startPhotoKey)
        : undefined,
      finishPhotoKey: ormEntity.finishPhotoKey
        ? new S3VO(ormEntity.finishPhotoKey)
        : undefined,
      sagaScreenshotKey: ormEntity.sagaScreenshotKey
        ? new S3VO(ormEntity.sagaScreenshotKey)
        : undefined,
      reviewerId: ormEntity.reviewerId
        ? new UuidVO(ormEntity.reviewerId)
        : undefined,
      userId: new UuidVO(ormEntity.userId),
      stitchesRaw: new StitchesVO(ormEntity.stitchesRaw),
      userComment: ormEntity.userComment,
      stitchesNormalized: ormEntity.stitchesNormalized,
      reviewerComment: ormEntity.reviewerComment,
      codeWord: new CodeWordOrmMapper().toDomainEntity(ormEntity.codeWord),
      reviewExpiresAt: ormEntity.reviewExpiresAt
        ? new DateVO(ormEntity.reviewExpiresAt)
        : undefined,
      skipReviewerId: ormEntity.skipReviewerId
        ? new UuidVO(ormEntity.skipReviewerId)
        : undefined,
      deleteAt: ormEntity.deleteAt ? new DateVO(ormEntity.deleteAt) : undefined,
      approvedAt: ormEntity.approvedAt
        ? new DateVO(ormEntity.approvedAt)
        : undefined,
    };
  }

  protected toOrmProps(entity: ReportEntity): OrmEntityProps<ReportOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      status: props.status,
      startPhotoKey: props.startPhotoKey ? props.startPhotoKey?.value : null,
      finishPhotoKey: props.finishPhotoKey ? props.finishPhotoKey.value : null,
      sagaScreenshotKey: props.sagaScreenshotKey
        ? props.sagaScreenshotKey.value
        : null,
      codeWordId: props.codeWord.id.value,
      reviewerId: props.reviewerId ? props.reviewerId.value : null,
      userId: props.userId.value,
      reviewerComment: props.reviewerComment,
      userComment: props.userComment,
      stitchesNormalized: props.stitchesNormalized,
      stitchesRaw: StitchesVO.toJSON(props.stitchesRaw),
      reviewExpiresAt: props.reviewExpiresAt
        ? props.reviewExpiresAt.ISOString
        : null,
      skipReviewerId: props.skipReviewerId ? props.skipReviewerId.value : null,
      deleteAt: props.deleteAt ? props.deleteAt.ISOString : null,
      approvedAt: props.approvedAt ? props.approvedAt.ISOString : null,
    };
  }
}
