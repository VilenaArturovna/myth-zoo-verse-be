import { CommandBase } from '@libs/base-classes';

import { LoginViaTgRequestDto } from './login-via-tg.request.dto';
import { UserEntity } from '@modules/users/domain';

export interface LoginViaTgResponse {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;
}

export class LoginViaTgCommand extends CommandBase<LoginViaTgRequestDto> {}
