import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DisableWordRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  word: string;
}
