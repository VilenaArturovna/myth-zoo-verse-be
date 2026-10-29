import { EntityBase } from '@libs/base-classes';
import { IdVO, S3VO } from '@libs/value-objects';
import { RangeVO, RarityType } from '@modules/world/domain';

export interface EggEntityProps {
  type: RarityType;
  imageKey: S3VO;
  cost: RangeVO;
  duration: RangeVO;
}

export class EggEntity extends EntityBase<EggEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: EggEntityProps): EggEntity {
    return new EggEntity({ props });
  }

  protected validate() {}
}
