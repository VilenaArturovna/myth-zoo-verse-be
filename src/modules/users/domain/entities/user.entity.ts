import { EntityBase } from '@libs/base-classes';
import { HashVO, IdVO, UrlVO } from '@libs/value-objects';
import { Role } from '@modules/users/types';
import { UserHasEmptyFieldsError } from '@modules/users/domain/errors';

export interface UserEntityProps {
  username: string;
  photoUrl?: UrlVO;
  tgId: string;
  totalStitches: number;
  crystals: number;
  role: Role;
  refreshTokenHash?: HashVO;
}

type CreateUserEntityProps = Pick<
  UserEntityProps,
  'tgId' | 'refreshTokenHash' | 'photoUrl'
> & {
  role?: Role;
  username?: string;
};

type UpdateUserEntityProps = Pick<UserEntityProps, 'photoUrl' | 'username'>;

export class UserEntity extends EntityBase<UserEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: CreateUserEntityProps): UserEntity {
    return new UserEntity({
      props: {
        ...props,
        role: props.role ?? Role.user,
        totalStitches: 0,
        crystals: 100,
        username: props.username ?? `Пользователь ${props.tgId}`,
      },
    });
  }

  public addStitches(value: number) {
    this.props.totalStitches += value;
  }

  public addCrystals(value: number) {
    this.props.crystals += value;
  }

  public debitCrystals(value: number) {
    this.props.crystals -= value;
  }

  public assignReviewer() {
    this.props.role = Role.reviewer;
  }

  public removeReviewerRole() {
    this.props.role = Role.user;
  }

  public update(props: UpdateUserEntityProps) {
    this.props.username = props.username;
    this.props.photoUrl = props.photoUrl;
  }

  public setRefreshTokenHash(refreshTokenHash: HashVO) {
    this.props.refreshTokenHash = refreshTokenHash;
  }

  protected validate() {
    const { role, tgId, crystals, totalStitches, username } = this.props;

    const requiredFields = [role, tgId, crystals, totalStitches, username];

    if (requiredFields.some((f) => f === null || f === undefined)) {
      throw new UserHasEmptyFieldsError();
    }
  }
}
