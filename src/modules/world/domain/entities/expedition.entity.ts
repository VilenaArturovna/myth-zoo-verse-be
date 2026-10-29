import { EntityBase } from '@libs/base-classes';
import { IdVO } from '@libs/value-objects';
import { RangeVO } from '@modules/world/domain';

export interface ExpeditionEntityProps {
  level: number;
  cost: RangeVO;
  duration: RangeVO;
}

export class ExpeditionEntity extends EntityBase<ExpeditionEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: ExpeditionEntityProps): ExpeditionEntity {
    return new ExpeditionEntity({ props });
  }

  protected validate() {}
}
