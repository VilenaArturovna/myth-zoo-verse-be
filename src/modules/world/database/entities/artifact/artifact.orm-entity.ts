import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { EffectProps, RarityType } from '@modules/world/domain';

export interface ArtifactOrmEntityProps {
  name: string;
  imageKey: string;
  type: RarityType;
  effect: EffectProps;
}

export class ArtifactOrmEntity
  extends OrmEntityBase<ArtifactOrmEntityProps>
  implements ArtifactOrmEntityProps
{
  name: string;
  imageKey: string;
  type: RarityType;
  effect: EffectProps;
}

export class ArtifactModel extends ModelBase implements ArtifactOrmEntity {
  name: string;
  imageKey: string;
  type: RarityType;
  effect: EffectProps;
}
