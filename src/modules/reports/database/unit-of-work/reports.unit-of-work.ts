import { TrxId, UnitOfWorkObjection } from '@libs/unit-of-work';
import {
  CodeWordObjectionRepository,
  ReportObjectionRepository,
} from '@modules/reports/database/repositories';

export class ReportsUnitOfWork extends UnitOfWorkObjection {
  public getReportRepository(trxId: TrxId) {
    return new ReportObjectionRepository(this, trxId);
  }

  public getCodeWordRepository(trxId: TrxId) {
    return new CodeWordObjectionRepository(this, trxId);
  }
}
