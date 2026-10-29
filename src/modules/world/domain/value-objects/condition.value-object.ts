import { ValueObject } from '@libs/base-classes/value-object.base';
import { RarityType } from '@modules/world/domain';

export interface ConditionProps {
  biomesLevels?: { count: number; level: number };
  materials?: { count: number };
  eggs?: { count: number; type: RarityType };
  expeditions?: { count: number; level: number };
}

export class ConditionVO extends ValueObject<ConditionProps> {
  constructor(props: ConditionProps) {
    super(props);
  }

  public static toJSON(props: ConditionVO): ConditionProps {
    return {
      biomesLevels: props.props.biomesLevels,
      materials: props.props.materials,
      eggs: props.props.eggs,
      expeditions: props.props.expeditions,
    };
  }
}
