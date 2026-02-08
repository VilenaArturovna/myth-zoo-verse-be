import { ValueObject } from '@libs/base-classes/value-object.base';
import { DomainException } from '@libs/exceptions';

export interface StitchesProps {
  crosses: number;
  halfCrosses: number;
  petits: number;
  beads: number;
}

export class StitchesVO extends ValueObject<StitchesProps> {
  constructor(props: StitchesProps) {
    super(props);
    this.validate();
  }

  static toJSON(vo: StitchesVO): StitchesProps {
    return {
      beads: vo.props.beads,
      crosses: vo.props.crosses,
      halfCrosses: vo.props.halfCrosses,
      petits: vo.props.petits,
    };
  }

  public calcNormalized(): number {
    return Math.ceil(
      this.props.crosses +
        this.props.halfCrosses / 2 +
        (this.props.petits + this.props.beads) / 1.5,
    );
  }

  public get crosses(): number {
    return this.props.crosses;
  }

  public get halfCrosses(): number {
    return this.props.halfCrosses;
  }

  public get petits(): number {
    return this.props.petits;
  }

  public get beads(): number {
    return this.props.beads;
  }

  private validate() {
    const negativeValues = [];

    for (const key in this.props) {
      if (this.props[key] < 0) {
        negativeValues.push(key);
      }
    }

    if (negativeValues.length) {
      throw new DomainException(
        `Значения ${negativeValues.join(', ')} меньше 0`,
      );
    }
  }
}
