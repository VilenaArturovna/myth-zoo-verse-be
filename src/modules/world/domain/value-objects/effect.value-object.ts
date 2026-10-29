import { ValueObject } from '@libs/base-classes/value-object.base';
import { EffectType, MathOperation } from '@modules/world/domain';

export interface EffectProps {
  effectType: EffectType;
  effectValue: number;
  mathOperation: MathOperation;
}

export class EffectVO extends ValueObject<EffectProps> {
  constructor(props: EffectProps) {
    super(props);
  }

  public static toJSON(props: EffectVO): EffectProps {
    return {
      effectType: props.props.effectType,
      effectValue: props.props.effectValue,
      mathOperation: props.props.mathOperation,
    };
  }
}
