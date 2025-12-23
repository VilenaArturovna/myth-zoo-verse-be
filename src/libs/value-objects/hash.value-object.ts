import { ValueObject } from '../base-classes/value-object.base';
import * as argon2 from 'argon2';

export class HashVO extends ValueObject<string> {
  constructor(value: string) {
    super({ value });
  }

  public get value() {
    return this.props.value;
  }

  static async generateHash(value: string): Promise<HashVO> {
    const hash = await argon2.hash(value);
    return new HashVO(hash);
  }
}
