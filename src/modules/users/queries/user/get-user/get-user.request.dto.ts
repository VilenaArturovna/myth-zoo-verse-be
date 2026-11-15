import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class GetUserRequestDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}
