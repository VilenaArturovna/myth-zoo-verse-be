import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { RangeProps } from '@modules/world/domain';

export interface ExpeditionOrmEntityProps {
  level: number;
  cost: RangeProps;
  duration: RangeProps;
}

export class ExpeditionOrmEntity
  extends OrmEntityBase<ExpeditionOrmEntityProps>
  implements ExpeditionOrmEntityProps
{
  cost: RangeProps;
  duration: RangeProps;
  level: number;
}

export class ExpeditionModel extends ModelBase implements ExpeditionOrmEntity {
  cost: RangeProps;
  duration: RangeProps;
  level: number;
}
