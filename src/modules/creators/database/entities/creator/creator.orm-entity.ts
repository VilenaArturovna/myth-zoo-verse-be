import { ModelBase, OrmEntityBase } from '@libs/base-classes';

export interface CreatorOrmEntityProps {
  userId: string;
  essence: number;
  eggStorageCapacity: number;
}

export class CreatorOrmEntity
  extends OrmEntityBase<CreatorOrmEntityProps>
  implements CreatorOrmEntityProps
{
  essence: number;
  userId: string;
  eggStorageCapacity: number;
}

export class CreatorModel extends ModelBase implements CreatorOrmEntity {
  essence: number;
  userId: string;
  eggStorageCapacity: number;
}
