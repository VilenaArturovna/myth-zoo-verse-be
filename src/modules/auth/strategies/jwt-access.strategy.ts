import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { GetUserReadDao } from '@modules/users/database/read-model';
import { ForbiddenException } from '@libs/exceptions';

export type JwtPayload = { id: string };

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly userReadDao: GetUserReadDao,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const result = await this.userReadDao.query({ params: { id: payload.id } });

    if (result.isErr) {
      throw new ForbiddenException('Вы не авторизованы');
    }

    return result.unwrap();
  }
}
