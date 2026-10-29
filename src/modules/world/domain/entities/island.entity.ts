import { EntityBase } from '@libs/base-classes';
import { IdVO } from '@libs/value-objects';
import { IslandLevelEntity } from '@modules/world/domain';

export interface IslandEntityProps {
  order?: number; // генерируется в pg
  biomesCount: number;
  cost: number;
  levels: IslandLevelEntity[];
}

export class IslandEntity extends EntityBase<IslandEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: IslandEntityProps): IslandEntity {
    return new IslandEntity({ props });
  }

  protected validate() {}
}
