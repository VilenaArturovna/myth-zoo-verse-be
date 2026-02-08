import { ApiProperty } from '@nestjs/swagger';
import { CodeWordEntity } from '@modules/reports/domain';

export class CodeWordResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  word: string;

  @ApiProperty()
  isActive: boolean;

  constructor(entity: CodeWordEntity) {
    const props = entity.getCopiedProps();
    this.id = entity.id.value;
    this.word = props.word;
    this.isActive = props.isActive;
  }
}
