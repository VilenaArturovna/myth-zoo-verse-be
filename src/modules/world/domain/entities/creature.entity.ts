import { EntityBase } from '@libs/base-classes';
import { IdVO, S3VO } from '@libs/value-objects';
import { EffectVO, RarityType } from '@modules/world/domain';

export interface CreatureEntityProps {
  name: string;
  imageKey: S3VO;
  type: RarityType;
  effect: EffectVO;
}

export class CreatureEntity extends EntityBase<CreatureEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: CreatureEntityProps): CreatureEntity {
    return new CreatureEntity({ props });
  }

  protected validate() {}
}
