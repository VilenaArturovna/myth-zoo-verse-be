import { ExceptionBase, ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { CodeWordEntity, CodeWordEntityProps } from '@modules/reports/domain';
import { CodeWordObjectionOrmEntity, CodeWordOrmEntity } from '../entities';
import { CodeWordOrmMapper } from '../mappers';
import { NotFoundException } from '@libs/exceptions';
import { Result } from '@libs/utils';
import { IdVO } from '@libs/value-objects';

export class CodeWordObjectionRepository extends ObjectionRepositoryBase<
  CodeWordEntity,
  CodeWordEntityProps,
  CodeWordOrmEntity,
  CodeWordObjectionOrmEntity,
  CodeWordOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(
      CodeWordObjectionOrmEntity,
      new CodeWordOrmMapper(),
      unitOfWork,
      trxId,
    );
  }

  async getOneByWord(
    word: string,
  ): Promise<Result<CodeWordEntity, ExceptionBase>> {
    try {
      const ormEntity = await this.repository.query().findOne('word', word);
      if (!ormEntity) {
        return Result.fail(new NotFoundException('Code word not found'));
      }

      const domainEntity = this.mapper.toDomainEntity(ormEntity);

      return Result.ok(domainEntity);
    } catch (e) {
      return Result.fail(e);
    }
  }

  async getRandom(
    prevCodeWordId?: IdVO,
  ): Promise<Result<CodeWordEntity, ExceptionBase>> {
    try {
      const qb = this.repository
        .query()
        .orderByRaw('random()')
        .where('isActive', true)
        .first();
      if (prevCodeWordId) {
        qb.whereNot('id', prevCodeWordId.value);
      }

      const ormEntity = await qb;
      if (!ormEntity) {
        return Result.fail(new NotFoundException('Code word not found'));
      }

      const domainEntity = this.mapper.toDomainEntity(ormEntity);

      return Result.ok(domainEntity);
    } catch (e) {
      return Result.fail(e);
    }
  }
}
