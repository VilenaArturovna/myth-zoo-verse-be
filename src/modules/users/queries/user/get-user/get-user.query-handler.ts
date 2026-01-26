import { QueryHandler } from '@nestjs/cqrs';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import {
  GetUserDaoModel,
  GetUserReadDao,
} from '@modules/users/database/read-model';
import { GetUserQuery } from './get-user.query';

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler {
  constructor(private readonly readDao: GetUserReadDao) {}

  async execute(
    query: GetUserQuery,
  ): Promise<Result<GetUserDaoModel, ExceptionBase>> {
    return this.readDao.query(query);
  }
}
