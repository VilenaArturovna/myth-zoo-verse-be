import { UserEntity } from '@modules/users/domain';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@modules/users/types';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ nullable: true })
  photoUrl?: string;

  @ApiProperty()
  totalStitches: number;

  @ApiProperty()
  crystals: number;

  @ApiProperty()
  role: Role;

  constructor(entity: UserEntity) {
    const props = entity.getCopiedProps();
    this.id = entity.id.value;
    this.updatedAt = entity.updatedAt.ISOString;
    this.createdAt = entity.createdAt.ISOString;
    this.username = props.username;
    this.photoUrl = props.photoUrl?.value;
    this.totalStitches = props.totalStitches;
    this.crystals = props.crystals;
    this.role = props.role;
  }
}
