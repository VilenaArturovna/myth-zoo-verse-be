import { ModelBase, OrmEntityBase } from '@libs/base-classes';

export interface CodeWordOrmEntityProps {
  word: string;
  isActive: boolean;
}

export class CodeWordOrmEntity
  extends OrmEntityBase<CodeWordOrmEntityProps>
  implements CodeWordOrmEntityProps
{
  word: string;
  isActive: boolean;
}

export class CodeWordModel extends ModelBase implements CodeWordOrmEntity {
  word: string;
  isActive: boolean;
}
