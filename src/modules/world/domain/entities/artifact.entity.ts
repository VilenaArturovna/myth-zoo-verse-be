import { EntityBase } from '@libs/base-classes';
import { IdVO, S3VO } from '@libs/value-objects';
import { EffectVO, RarityType } from '@modules/world/domain';

export interface ArtifactEntityProps {
  name: string;
  imageKey: S3VO;
  type: RarityType;
  effect: EffectVO;
}

export class ArtifactEntity extends EntityBase<ArtifactEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: ArtifactEntityProps): ArtifactEntity {
    return new ArtifactEntity({ props });
  }

  protected validate() {}
}
