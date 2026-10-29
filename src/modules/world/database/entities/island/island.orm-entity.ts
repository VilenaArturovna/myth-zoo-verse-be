import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import {
  IslandLevelOrmEntity,
  IslandLevelOrmEntityProps,
} from '@modules/world/database/entities';

export interface IslandOrmEntityProps {
  order?: number;
  biomesCount: number;
  cost: number;
  levels?: IslandLevelOrmEntityProps[];
}

export class IslandOrmEntity
  extends OrmEntityBase<IslandOrmEntityProps>
  implements IslandOrmEntityProps
{
  order?: number;
  biomesCount: number;
  cost: number;
  levels?: IslandLevelOrmEntity[];
}

export class IslandModel extends ModelBase implements IslandOrmEntity {
  order?: number;
  biomesCount: number;
  cost: number;
  levels?: IslandLevelOrmEntity[];
}
