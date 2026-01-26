import { UserResponseDto } from '@modules/users/dtos';
import { ApiProperty } from '@nestjs/swagger';

export class LoginViaTgResponseDto extends UserResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
