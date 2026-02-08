import { TrxId, UnitOfWorkObjection } from '@libs/unit-of-work';
import { UserObjectionRepository } from '@modules/users/database/repositories';

export class UsersUnitOfWork extends UnitOfWorkObjection {
  public getUserRepository(trxId: TrxId) {
    return new UserObjectionRepository(this, trxId);
  }
}
