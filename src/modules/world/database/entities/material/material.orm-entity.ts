import { ModelBase, OrmEntityBase } from '@libs/base-classes';
import { MaterialCode } from '@modules/world/domain';

export interface MaterialOrmEntityProps {
  imageKey: string;
  code: MaterialCode;
  name: string;
}

export class MaterialOrmEntity
  extends OrmEntityBase<MaterialOrmEntityProps>
  implements MaterialOrmEntityProps
{
  imageKey: string;
  code: MaterialCode;
  name: string;
}

export class MaterialModel extends ModelBase implements MaterialOrmEntity {
  imageKey: string;
  code: MaterialCode;
  name: string;
}
