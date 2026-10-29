import { ValueObject } from '@libs/base-classes/value-object.base';
import crypto from 'crypto';

export interface RangeProps {
  min: number;
  max: number;
}

export class RangeVO extends ValueObject<RangeProps> {
  constructor(props: RangeProps) {
    super(props);
  }

  public static toJSON(props: RangeVO): RangeProps {
    return {
      min: props.props.min,
      max: props.props.max,
    };
  }

  public generateValue(): number {
    return crypto.randomInt(this.props.min, this.props.max);
  }
}
