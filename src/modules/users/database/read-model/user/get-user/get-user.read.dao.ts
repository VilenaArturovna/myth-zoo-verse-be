import { ReadDaoBase, ExceptionBase } from '@libs/base-classes';
import { Result } from '@libs/utils';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { GetUserQuery } from '@modules/users/queries';
import { Role } from '@modules/users/types';

export class GetUserDaoModel {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ nullable: true })
  photoUrl?: string;

  @ApiProperty()
  totalStitches: number;

  @ApiProperty()
  crystals: number;

  @ApiProperty()
  role: Role;

  @ApiPropertyOptional({ nullable: true })
  refreshTokenHash?: string;
}

export abstract class GetUserReadDao extends ReadDaoBase<
  GetUserDaoModel,
  GetUserQuery
> {
  abstract query(
    query: GetUserQuery,
  ): Promise<Result<GetUserDaoModel, ExceptionBase>>;
}
