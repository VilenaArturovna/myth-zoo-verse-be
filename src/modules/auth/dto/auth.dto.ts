import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { normalizeEmail } from '../domain/auth.security';

export class EmailDto {
  @ApiProperty({
    example: 'user@example.com',
    maxLength: 254,
    description: 'ASCII email; trim + lowercase, без изменения точек/суффиксов',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsString()
  @IsEmail({ allow_utf8_local_part: false })
  @MaxLength(254)
  @Matches(/^[\x21-\x7e]+$/)
  email: string;
}
export class RegisterDto extends EmailDto {
  @ApiProperty({
    minLength: 15,
    maxLength: 128,
    description: 'Unicode и пробелы разрешены; пароль не нормализуется',
  })
  @IsString()
  @Length(15, 128)
  password: string;
}
export class LoginDto extends EmailDto {
  @ApiProperty({ maxLength: 128 })
  @IsString()
  @Length(1, 128)
  password: string;
}
export class TokenDto {
  @ApiProperty({
    description: 'Одноразовый токен из fragment ссылки; погашается только POST',
  })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  token: string;
}
export class ResetPasswordDto extends TokenDto {
  @ApiProperty({ minLength: 15, maxLength: 128 })
  @IsString()
  @Length(15, 128)
  password: string;
}
export class MessageDto {
  @ApiProperty() message: string;
}
export class ProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() username: string;
  @ApiProperty({ nullable: true }) email: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  emailVerifiedAt: string | null;
  @ApiProperty({ nullable: true }) photoUrl: string | null;
  @ApiProperty() role: string;
  @ApiProperty() totalStitches: number;
  @ApiProperty() crystals: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
}
export class SessionDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({ example: 900 }) expiresIn: number;
  @ApiProperty({ type: ProfileDto }) user: ProfileDto;
}
