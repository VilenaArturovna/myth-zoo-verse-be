import { ExceptionBase, ObjectionRepositoryBase } from '@libs/base-classes';
import { TrxId, UnitOfWork } from '@libs/unit-of-work';
import { ReportEntity, ReportEntityProps } from '@modules/reports/domain';
import { ReportObjectionOrmEntity, ReportOrmEntity } from '../entities';
import { ReportOrmMapper } from '../mappers';
import { IdVO, UuidVO } from '@libs/value-objects';
import { Result } from '@libs/utils';
import { NotFoundException } from '@libs/exceptions';

export class ReportObjectionRepository extends ObjectionRepositoryBase<
  ReportEntity,
  ReportEntityProps,
  ReportOrmEntity,
  ReportObjectionOrmEntity,
  ReportOrmMapper
> {
  constructor(
    protected readonly unitOfWork: UnitOfWork,
    protected readonly trxId: TrxId,
  ) {
    super(ReportObjectionOrmEntity, new ReportOrmMapper(), unitOfWork, trxId);
    this.graph = {
      codeWord: true,
    };
  }

  private readonly graph: object;

  async getLastByUser(
    userId: UuidVO,
  ): Promise<Result<ReportEntity | null, ExceptionBase>> {
    try {
      const report = await this.repository
        .query()
        .findOne({ userId: userId.value })
        .orderBy('createdAt', 'DESC')
        .withGraphJoined(this.graph);

      if (!report) {
        return Result.ok(null);
      }

      return Result.ok(new ReportOrmMapper().toDomainEntity(report));
    } catch (e) {
      return Result.fail(e);
    }
  }

  async getOneById(id: IdVO): Promise<Result<ReportEntity, ExceptionBase>> {
    const transaction = this.unitOfWork.getTrx(this.trxId);

    try {
      const ormEntity = await this.repository
        .query(transaction)
        .findById(id.value)
        .withGraphJoined(this.graph);

      if (!ormEntity) {
        return Result.fail(new NotFoundException('Entity not found'));
      }

      const domainEntity = this.mapper.toDomainEntity(ormEntity);

      return Result.ok(domainEntity);
    } catch (e) {
      return Result.fail(e);
    }
  }
}
