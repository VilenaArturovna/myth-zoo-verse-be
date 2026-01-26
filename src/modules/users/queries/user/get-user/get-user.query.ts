import { QueryBase } from '@libs/base-classes';
import { GetUserRequestDto } from '@modules/users/queries';

export class GetUserQuery extends QueryBase<GetUserRequestDto> {}
