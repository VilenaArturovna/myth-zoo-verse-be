import { EntityBase } from '@libs/base-classes';
import { IdVO, S3VO } from '@libs/value-objects';
import { MaterialCode } from '@modules/world/domain';

export interface MaterialEntityProps {
  imageKey: S3VO;
  code: MaterialCode;
  name: string;
}

export class MaterialEntity extends EntityBase<MaterialEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: MaterialEntityProps): MaterialEntity {
    return new MaterialEntity({ props });
  }

  protected validate() {}
}
