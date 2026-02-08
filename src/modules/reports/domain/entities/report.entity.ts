import { EntityBase } from '@libs/base-classes';
import { DateVO, IdVO, S3VO, UuidVO } from '@libs/value-objects';
import { CodeWordEntity, StitchesVO } from '@modules/reports/domain';
import { ReportStatus } from '@modules/reports/types';
import { ConflictException, ForbiddenException } from '@libs/exceptions';

export interface ReportEntityProps {
  codeWord: CodeWordEntity;
  userId: UuidVO;
  startPhotoKey?: S3VO;
  finishPhotoKey?: S3VO;
  sagaScreenshotKey?: S3VO;
  userComment?: string;
  reviewerComment?: string;
  status: ReportStatus;
  reviewerId?: UuidVO;
  reviewExpiresAt?: DateVO; // TODO add cron return to 'pending'
  stitchesNormalized: number;
  stitchesRaw: StitchesVO;
  skipReviewerId?: UuidVO; // чтобы этот же отчет снова не попался на проверке
  deleteAt?: DateVO; // когда МОЖНО удалить
  approvedAt?: DateVO;
}

type CreateReportEntityProps = Pick<ReportEntityProps, 'codeWord' | 'userId'>;

type UpdateReportEntityProps = Pick<
  ReportEntityProps,
  | 'startPhotoKey'
  | 'finishPhotoKey'
  | 'sagaScreenshotKey'
  | 'userComment'
  | 'stitchesRaw'
>;

export class ReportEntity extends EntityBase<ReportEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: CreateReportEntityProps): ReportEntity {
    return new ReportEntity({
      props: {
        ...props,
        stitchesNormalized: 0,
        status: ReportStatus.draft,
        stitchesRaw: new StitchesVO({
          crosses: 0,
          halfCrosses: 0,
          beads: 0,
          petits: 0,
        }),
      },
    });
  }

  // getters
  public get codeWordId(): IdVO {
    return this.props.codeWord.id;
  }

  public get isDraft(): boolean {
    return this.props.status === ReportStatus.draft;
  }

  // setters

  // checkers
  public checkCanUpdate() {
    if (
      ![ReportStatus.pending, ReportStatus.rejected].includes(this.props.status)
    ) {
      throw new ConflictException('Вы не можете изменить отчет');
    }
  }

  private checkCanSendToReview() {
    if (
      ![ReportStatus.draft, ReportStatus.rejected].includes(this.props.status)
    ) {
      throw new ConflictException(
        'Вы не можете отправить этот отчет на проверку',
      );
    }
  }

  public checkIsMyReport(userId: UuidVO) {
    if (!this.props.userId.isEqualTo(userId)) {
      throw new ForbiddenException('Это не Ваш отчет');
    }
  }

  private checkInReview() {
    if (this.props.status !== ReportStatus.inReview) {
      throw new ForbiddenException('Отчет не находится на проверке');
    }
  }

  // methods
  public update(props: UpdateReportEntityProps) {
    this.props.startPhotoKey = props.startPhotoKey ?? null;
    this.props.finishPhotoKey = props.finishPhotoKey ?? null;
    this.props.sagaScreenshotKey = props.sagaScreenshotKey ?? null;
    this.props.userComment = props.userComment ?? null;
    this.props.stitchesRaw = props.stitchesRaw;
    this.props.stitchesNormalized = props.stitchesRaw.calcNormalized();

    this.validate();
  }

  public sendToReview() {
    this.checkCanSendToReview();

    this.props.status = ReportStatus.pending;
  }

  public addStartPhoto(key: S3VO) {
    if (!this.isDraft) {
      throw new ForbiddenException(
        'Стартовое фото можно добавить только к черновику отчета',
      );
    }
    this.props.startPhotoKey = key;
  }

  public startReview(reviewerId: UuidVO) {
    if (this.props.status !== ReportStatus.pending) {
      throw new ForbiddenException('Отчет не был отправлен на проверку');
    }

    this.props.status = ReportStatus.inReview;
    this.props.reviewerId = reviewerId;
    this.props.skipReviewerId = null;
    this.props.reviewExpiresAt = DateVO.now().add(5, 'minutes');
  }

  public skip() {
    this.checkInReview();

    this.props.status = ReportStatus.pending;
    this.props.reviewExpiresAt = null;
    this.props.skipReviewerId = this.props.reviewerId;
    this.props.reviewerId = null;
  }

  public reject(reviewerComment: string) {
    this.checkInReview();

    this.props.status = ReportStatus.rejected;
    this.props.reviewerId = null;
    this.props.reviewExpiresAt = null;
    this.props.reviewerComment = reviewerComment;
  }

  public approve() {
    this.checkInReview();

    this.props.status = ReportStatus.approved;
    this.props.reviewExpiresAt = null;
    this.props.deleteAt = DateVO.now().add(1, 'week');
    this.props.approvedAt = DateVO.now();
  }

  protected validate() {
    if (
      this.props.stitchesNormalized < 100 &&
      this.props.status !== ReportStatus.draft
    ) {
      throw new ForbiddenException('Минимальный размер отчета - 100 крестиков');
    }
  }
}
