import {
  CreateEntityProps,
  OrmEntityProps,
  OrmMapper,
} from '@libs/base-classes';
import { CodeWordEntity, CodeWordEntityProps } from '@modules/reports/domain';
import { CodeWordOrmEntity, CodeWordOrmEntityProps } from '../entities';

export class CodeWordOrmMapper extends OrmMapper<
  CodeWordEntity,
  CodeWordEntityProps,
  CodeWordOrmEntity
> {
  protected getEntityConstructor(): {
    new (props: CreateEntityProps<CodeWordEntityProps>): CodeWordEntity;
  } {
    return CodeWordEntity;
  }

  protected getOrmEntityConstructor(): {
    new (props: CodeWordOrmEntityProps): CodeWordOrmEntity;
  } {
    return CodeWordOrmEntity;
  }

  protected toDomainProps(ormEntity: CodeWordOrmEntity): CodeWordEntityProps {
    return {
      word: ormEntity.word,
      isActive: ormEntity.isActive,
    };
  }

  protected toOrmProps(
    entity: CodeWordEntity,
  ): OrmEntityProps<CodeWordOrmEntity> {
    const props = entity.getCopiedProps();
    return {
      word: props.word,
      isActive: props.isActive,
    };
  }
}
