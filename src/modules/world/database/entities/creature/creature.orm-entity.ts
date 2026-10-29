import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { EffectProps, RarityType } from '@modules/world/domain';

export interface CreatureOrmEntityProps {
  name: string;
  imageKey: string;
  type: RarityType;
  effect: EffectProps;
  biomeId: string;
}

export class CreatureOrmEntity
  extends OrmEntityBase<CreatureOrmEntityProps>
  implements CreatureOrmEntityProps
{
  name: string;
  imageKey: string;
  type: RarityType;
  effect: EffectProps;
  biomeId: string;
}

export class CreatureModel extends ModelBase implements CreatureOrmEntity {
  name: string;
  imageKey: string;
  type: RarityType;
  effect: EffectProps;
  biomeId: string;
}
