import { TrxId, UnitOfWorkObjection } from '@libs/unit-of-work';
import {
  ArtifactObjectionRepository,
  BiomeBuildingObjectionRepository,
  BiomeObjectionRepository,
  CreatureObjectionRepository,
  EggObjectionRepository,
  ExpeditionObjectionRepository,
  IslandLevelObjectionRepository,
  IslandObjectionRepository,
  MaterialObjectionRepository,
} from '@modules/world/database/repositories';

export class WorldUnitOfWork extends UnitOfWorkObjection {
  public getBiomeRepository(trxId: TrxId) {
    return new BiomeObjectionRepository(this, trxId);
  }

  public getIslandRepository(trxId: TrxId) {
    return new IslandObjectionRepository(this, trxId);
  }

  public getBiomeBuildingRepository(trxId: TrxId) {
    return new BiomeBuildingObjectionRepository(this, trxId);
  }

  public getArtifactRepository(trxId: TrxId) {
    return new ArtifactObjectionRepository(this, trxId);
  }

  public getMaterialRepository(trxId: TrxId) {
    return new MaterialObjectionRepository(this, trxId);
  }

  public getEggRepository(trxId: TrxId) {
    return new EggObjectionRepository(this, trxId);
  }

  public getIslandLevelRepository(trxId: TrxId) {
    return new IslandLevelObjectionRepository(this, trxId);
  }

  public getExpeditionRepository(trxId: TrxId) {
    return new ExpeditionObjectionRepository(this, trxId);
  }

  public getCreatureRepository(trxId: TrxId) {
    return new CreatureObjectionRepository(this, trxId);
  }
}
