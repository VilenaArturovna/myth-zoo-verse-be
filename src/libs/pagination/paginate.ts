import { Knex } from 'knex';
import { ExceptionBase } from '../base-classes';
import { ConflictException } from '../exceptions';
import { Result } from '../utils';
import { PaginationResponseDto } from './pagination.response.dto';
import { Model } from 'objection';

export const paginate = async <T>(options: {
  qb: Knex.QueryBuilder;
  limit: number;
  page: number;
  isGrouped: boolean;
}): Promise<Result<PaginationResponseDto<T>, ExceptionBase>> => {
  const { page, limit, qb } = options;

  const knex = Model.knex();

  const counts = await knex
    .count('* as count')
    .from(qb.clone().as('t1'))
    .first();

  const total = Number(counts?.count ?? 0);
  const pageCount = Math.ceil(total / limit) || 1;
  const pageOffset = Math.floor(page * limit - limit);

  if (page > pageCount) {
    return Result.fail(new ConflictException(`Count of pages is ${pageCount}`));
  }

  const data = await qb.limit(limit).offset(pageOffset);

  return Result.ok({
    data,
    page,
    limit,
    total,
  });
};
