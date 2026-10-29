import { EntityBase } from '@libs/base-classes';
import { IdVO, S3VO } from '@libs/value-objects';
import {
  BiomeBuildingEntity,
  BiomeCode,
  CreatureEntity,
  EggEntity,
  ExpeditionEntity,
} from '@modules/world/domain';

export interface BiomeEntityProps {
  code: BiomeCode;
  name: string;
  imageKey: S3VO;
  cost: number;
  building: BiomeBuildingEntity;
  eggs: EggEntity[];
  creatures: CreatureEntity[];
  expeditions?: ExpeditionEntity[];
}

export class BiomeEntity extends EntityBase<BiomeEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: BiomeEntityProps): BiomeEntity {
    return new BiomeEntity({ props });
  }

  protected validate() {}
}
