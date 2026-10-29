import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import {
  ConditionProps,
  PossibilityProps,
} from '@modules/world/domain/value-objects';

export interface IslandLevelOrmEntityProps {
  condition: ConditionProps;
  possibility: PossibilityProps;
  islandId: string;
  order: number;
}

export class IslandLevelOrmEntity
  extends OrmEntityBase<IslandLevelOrmEntityProps>
  implements IslandLevelOrmEntityProps
{
  condition: ConditionProps;
  possibility: PossibilityProps;
  islandId: string;
  order: number;
}

export class IslandLevelModel
  extends ModelBase
  implements IslandLevelOrmEntity
{
  condition: ConditionProps;
  possibility: PossibilityProps;
  islandId: string;
  order: number;
}
