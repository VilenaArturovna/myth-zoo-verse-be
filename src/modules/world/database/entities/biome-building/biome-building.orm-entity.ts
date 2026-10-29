import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { EffectProps } from '@modules/world/domain';

export interface BiomeBuildingOrmEntityProps {
  name: string;
  cost: number;
  imageKey: string;
  effect: EffectProps;
  biomeId: string;
}

export class BiomeBuildingOrmEntity
  extends OrmEntityBase<BiomeBuildingOrmEntityProps>
  implements BiomeBuildingOrmEntityProps
{
  cost: number;
  effect: EffectProps;
  imageKey: string;
  name: string;
  biomeId: string;
}

export class BiomeBuildingModel
  extends ModelBase
  implements BiomeBuildingOrmEntity
{
  cost: number;
  effect: EffectProps;
  imageKey: string;
  name: string;
  biomeId: string;
}
