import { EntityBase } from '@libs/base-classes';
import { IdVO, UuidVO } from '@libs/value-objects';
import { ConflictException } from '@libs/exceptions';

export interface CreatorEntityProps {
  userId: UuidVO;
  essence: number;
  eggStorageCapacity: number;
}

type CreateProps = Pick<CreatorEntityProps, 'userId'>;

export class CreatorEntity extends EntityBase<CreatorEntityProps> {
  protected readonly _id: IdVO;

  public static create(props: CreateProps): CreatorEntity {
    return new CreatorEntity({
      props: {
        userId: props.userId,
        essence: 0,
        eggStorageCapacity: 20,
      },
    });
  }

  public addEssence(value: number) {
    this.props.essence = this.props.essence + value;
  }

  public debitEssence(value: number) {
    if (value > this.props.essence) {
      throw new ConflictException('Не хватает эссенции');
    }
    this.props.essence = this.props.essence - value;
  }

  protected validate() {}
}
