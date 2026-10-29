import { EntityBase } from '@libs/base-classes';
import { IdVO } from '@libs/value-objects';
import { ConditionVO, PossibilityVO } from '@modules/world/domain';

export interface IslandLevelEntityProps {
  order: number;
  condition: ConditionVO;
  possibility: PossibilityVO;
}

export class IslandLevelEntity extends EntityBase<IslandLevelEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: IslandLevelEntityProps): IslandLevelEntity {
    return new IslandLevelEntity({ props });
  }

  protected validate() {}
}
