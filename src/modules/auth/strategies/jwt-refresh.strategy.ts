import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Важно: достаем refresh из cookie
function cookieExtractor(req: any): string | null {
  return req?.cookies?.refreshToken ?? null;
}

export type RefreshPayload = { sub: string };

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    // TODO: подключи свой UsersService и проверь refresh против БД
    // private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: RefreshPayload) {
    const token = req?.cookies?.refreshToken;
    if (!token) throw new UnauthorizedException('No refresh token');

    // РЕКОМЕНДОВАНО: проверить, что refresh токен совпадает с хешем в БД (и не отозван)
    // const user = await this.usersService.getUserIfRefreshTokenMatches(payload.sub, token);
    // if (!user) throw new UnauthorizedException();

    return { userId: payload.sub };
  }
}
