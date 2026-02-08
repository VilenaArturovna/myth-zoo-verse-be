import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AtLeastOneOf } from '@src/common';

export class SendToReviewReportRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  startPhotoKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  finishPhotoKey: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sagaScreenshotKey?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  userComment?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  crosses?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  halfCrosses?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  petits?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  beads?: number;

  @AtLeastOneOf(['crosses', 'halfCrosses', 'petits', 'beads'], {
    message: 'Необходимо заполнить данные о стежках',
  })
  _atLeastOne!: never;
}
