import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import { AccessClaims, publicProfile } from '../domain/auth.security';
import { activeSession } from '../database/auth.repository';
export type JwtPayload = AccessClaims;
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('jwt.accessSecret'),
      algorithms: ['HS256'],
      issuer: 'myth-zoo-verse',
      audience: 'platform',
    });
  }
  async validate(payload: AccessClaims) {
    if (
      payload.typ !== 'access' ||
      !isUUID(payload.sub) ||
      !isUUID(payload.sid)
    )
      throw new UnauthorizedException('Сессия недействительна');
    const user = await activeSession(payload.sub, payload.sid);
    if (!user) throw new UnauthorizedException('Сессия недействительна');
    return {
      ...publicProfile(user),
      sessionId: payload.sid,
      csrfHash: user.csrfHash,
    };
  }
}
