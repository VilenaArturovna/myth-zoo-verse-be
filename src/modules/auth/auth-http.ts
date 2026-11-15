import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthSettings } from '@src/common/config/auth-configuration';
import { equalSecret, hashSecret } from './domain/auth.security';

export const REFRESH_COOKIE = 'platform_refresh';
export const CSRF_COOKIE = 'platform_csrf';
@Injectable()
export class AuthOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const allowed = this.config.get<AuthSettings>('auth').allowedOrigins;
    if (
      !allowed.includes(req.get('origin')) ||
      (req.method !== 'GET' && !req.is('application/json'))
    )
      throw new ForbiddenException('Недопустимый источник запроса');
    return true;
  }
}
@Injectable()
export class AuthCsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const header = req.get('x-csrf-token');
    const cookie = req.cookies?.[CSRF_COOKIE];
    if (
      typeof header !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(header) ||
      typeof cookie !== 'string' ||
      !equalSecret(header, cookie) ||
      (req.user && !equalSecret(hashSecret(header), req.user.csrfHash))
    )
      throw new ForbiddenException('Проверка CSRF не пройдена');
    return true;
  }
}
@Injectable()
export class AuthCookies {
  private readonly settings: AuthSettings;
  constructor(config: ConfigService) {
    this.settings = config.get<AuthSettings>('auth');
  }
  private options() {
    return {
      secure: this.settings.cookieSecure,
      sameSite: this.settings.cookieSameSite,
      path: '/auth',
      httpOnly: true,
    };
  }
  set(res: Response, session: any) {
    const options = { ...this.options(), expires: new Date(session.expiresAt) };
    res.cookie(REFRESH_COOKIE, session.refresh, options);
    // The CSRF value is returned by /auth/csrf for a frontend on another host.
    res.cookie(CSRF_COOKIE, session.csrf, options);
  }
  clear(res: Response) {
    res.clearCookie(REFRESH_COOKIE, this.options());
    res.clearCookie(CSRF_COOKIE, this.options());
  }
}
