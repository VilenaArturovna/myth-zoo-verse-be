import { EntityBase } from '@libs/base-classes';
import { IdVO, S3VO } from '@libs/value-objects';
import { EffectVO } from '@modules/world/domain';

export interface BiomeBuildingEntityProps {
  name: string;
  cost: number;
  imageKey: S3VO;
  effect: EffectVO;
}

export class BiomeBuildingEntity extends EntityBase<BiomeBuildingEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: BiomeBuildingEntityProps): BiomeBuildingEntity {
    return new BiomeBuildingEntity({ props });
  }

  protected validate() {}
}
