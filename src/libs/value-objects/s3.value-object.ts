import { ValueObject } from '../base-classes/value-object.base';

export class S3VO extends ValueObject<string> {
  constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  static url(value: string): string {
    // TODO generate url
    // Вы можете привязать к бакету свой домен
    return value;
  }
}
