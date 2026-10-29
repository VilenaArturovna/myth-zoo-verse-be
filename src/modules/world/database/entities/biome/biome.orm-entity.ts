import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { BiomeCode } from '@modules/world/domain';
import {
  BiomeBuildingOrmEntity,
  CreatureOrmEntity,
  EggOrmEntity,
} from '@modules/world/database/entities';

export interface BiomeOrmEntityProps {
  code: BiomeCode;
  name: string;
  imageKey: string;
  cost: number;
  eggs?: EggOrmEntity[];
  creatures?: CreatureOrmEntity[];
  building?: BiomeBuildingOrmEntity;
}

export class BiomeOrmEntity
  extends OrmEntityBase<BiomeOrmEntityProps>
  implements BiomeOrmEntityProps
{
  code: BiomeCode;
  cost: number;
  imageKey: string;
  name: string;
  eggs?: EggOrmEntity[];
  creatures?: CreatureOrmEntity[];
  building?: BiomeBuildingOrmEntity;
}

export class BiomeModel extends ModelBase implements BiomeOrmEntity {
  code: BiomeCode;
  cost: number;
  imageKey: string;
  name: string;
  eggs?: EggOrmEntity[];
  creatures?: CreatureOrmEntity[];
  building?: BiomeBuildingOrmEntity;
}
