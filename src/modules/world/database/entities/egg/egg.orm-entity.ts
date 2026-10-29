import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { RangeProps, RarityType } from '@modules/world/domain';

export interface EggOrmEntityProps {
  type: RarityType;
  imageKey: string;
  cost: RangeProps;
  duration: RangeProps;
  biomeId?: string;
}

export class EggOrmEntity
  extends OrmEntityBase<EggOrmEntityProps>
  implements EggOrmEntityProps
{
  type: RarityType;
  imageKey: string;
  cost: RangeProps;
  duration: RangeProps;
  biomeId?: string;
}

export class EggModel extends ModelBase implements EggOrmEntity {
  type: RarityType;
  imageKey: string;
  cost: RangeProps;
  duration: RangeProps;
  biomeId?: string;
}
