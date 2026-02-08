import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddStartPhotoRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  startPhotoKey: string;
}
