import { ValueObject } from '@libs/base-classes/value-object.base';

export interface PossibilityProps {
  biomes?: { count: number };
  expeditions?: { level: number };
  eggStorageCapacity: { count: number };
}

export class PossibilityVO extends ValueObject<PossibilityProps> {
  constructor(props: PossibilityProps) {
    super(props);
  }

  public static toJSON(props: PossibilityVO): PossibilityProps {
    return {
      biomes: props.props.biomes,
      expeditions: props.props.expeditions,
      eggStorageCapacity: props.props.eggStorageCapacity,
    };
  }
}
