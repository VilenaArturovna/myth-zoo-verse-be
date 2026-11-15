import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Model } from 'objection';
import { Result } from '@libs/utils';
import { UnauthorizedException } from '@nestjs/common';
import { publicProfile } from '../domain/auth.security';
export class GetOwnProfileQuery {
  constructor(readonly userId: string) {}
}
@QueryHandler(GetOwnProfileQuery)
export class GetOwnProfileHandler implements IQueryHandler<GetOwnProfileQuery> {
  async execute(query: GetOwnProfileQuery) {
    const user = await Model.knex()('users')
      .where({ id: query.userId })
      .first();
    if (!user) return Result.fail(new UnauthorizedException());
    return Result.ok(publicProfile(user));
  }
}
