import { EntityBase } from '@libs/base-classes';
import { IdVO } from '@libs/value-objects';

export interface CodeWordEntityProps {
  word: string;
  isActive: boolean;
}

export class CodeWordEntity extends EntityBase<CodeWordEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: CodeWordEntityProps): CodeWordEntity {
    return new CodeWordEntity({ props });
  }

  public get word() {
    return this.props.word;
  }

  public disable() {
    this.props.isActive = false;
  }

  protected validate() {}
}
