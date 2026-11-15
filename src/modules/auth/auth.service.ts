import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CommandBus } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { AuthSettings } from '@src/common/config/auth-configuration';
import { AuthCommand, AuthAction } from '@modules/auth/commands';
import { AuthMailService } from './mail/auth-mail.service';
import { Model } from 'objection';
import { authUserByEmail } from './database/auth.repository';
import {
  hashSecret,
  newSecret,
  PASSWORD_OPTIONS,
  normalizeEmail,
  AccessClaims,
} from './domain/auth.security';
import { AuthRateLimitService } from './auth-rate-limit.service';

export const NEUTRAL_MESSAGE =
  'Если действие доступно для этого адреса, будет отправлено письмо. Запрос принят; доставка не гарантируется.';
@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash: string;
  private readonly settings: AuthSettings;
  constructor(
    private readonly config: ConfigService,
    private readonly commands: CommandBus,
    private readonly jwt: JwtService,
    private readonly mail: AuthMailService,
    private readonly limits: AuthRateLimitService,
  ) {
    this.settings = config.get<AuthSettings>('auth');
  }
  async onModuleInit() {
    this.dummyHash = await argon2.hash(newSecret(), PASSWORD_OPTIONS);
  }
  private async execute(action: AuthAction, ...args: any[]) {
    const result = await this.commands.execute(
      new AuthCommand({ payload: { action, args } }),
    );
    return result.unwrap();
  }
  async register(email: string, password: string, ip: string) {
    email = normalizeEmail(email);
    await this.limits.consume('register', ip, email, true);
    const hash = await argon2.hash(password, PASSWORD_OPTIONS);
    const token = newSecret();
    const result = await this.execute(
      'register',
      email,
      hash,
      hashSecret(token),
      this.settings.verifySeconds,
    );
    if (result.mail) await this.mail.send(email, 'verify-email', token);
    return { message: NEUTRAL_MESSAGE };
  }
  async requestToken(
    email: string,
    purpose: 'verify-email' | 'reset-password',
    ip: string,
  ) {
    email = normalizeEmail(email);
    await this.limits.consume(
      purpose === 'verify-email' ? 'resend' : 'forgot',
      ip,
      email,
      true,
    );
    const token = newSecret();
    const ttl =
      purpose === 'verify-email'
        ? this.settings.verifySeconds
        : this.settings.resetSeconds;
    const result = await this.execute(
      'requestToken',
      email,
      purpose,
      hashSecret(token),
      ttl,
    );
    if (result.mail) await this.mail.send(email, purpose, token);
    return { message: NEUTRAL_MESSAGE };
  }
  async verifyEmail(token: string, ip: string) {
    await this.limits.consume('token', ip, hashSecret(token));
    await this.execute('consumeToken', hashSecret(token), 'verify-email');
    return { message: 'Почта подтверждена. Войдите в аккаунт.' };
  }
  async resetPassword(token: string, password: string, ip: string) {
    await this.limits.consume('token', ip, hashSecret(token));
    const passwordHash = await argon2.hash(password, PASSWORD_OPTIONS);
    const result = await this.execute(
      'consumeToken',
      hashSecret(token),
      'reset-password',
      passwordHash,
    );
    if (result.mail)
      await this.mail.send(result.mail.email, 'password-changed');
    return { message: 'Пароль изменён. Войдите с новым паролем.' };
  }
  async login(email: string, password: string, ip: string) {
    email = normalizeEmail(email);
    await this.limits.consume('login', ip, email);
    const user = await authUserByEmail(email);
    const valid = await argon2.verify(
      user?.passwordHash ?? this.dummyHash,
      password,
    );
    if (!valid || !user?.passwordHash || !user.emailVerifiedAt)
      throw new UnauthorizedException('Неверные учётные данные');
    const secrets = this.secrets();
    const result = await this.execute(
      'login',
      user.id,
      user.passwordHash,
      secrets.database,
    );
    return this.sessionResponse(result, secrets.refresh, secrets.csrf);
  }
  async refresh(refresh: string, csrf: string, ip: string) {
    const known =
      refresh &&
      (await Model.knex()('authRefreshTokens')
        .where({ hash: hashSecret(refresh) })
        .first('sessionId'));
    await this.limits.consume(
      'refresh',
      ip,
      known?.sessionId ?? hashSecret(refresh ?? 'missing'),
    );
    if (!refresh || !/^[A-Za-z0-9_-]{43}$/.test(refresh) || !csrf)
      throw new UnauthorizedException('Сессия недействительна');
    const next = newSecret();
    const result = await this.execute(
      'refresh',
      hashSecret(refresh),
      hashSecret(csrf),
      hashSecret(next),
      this.settings.refreshDuplicateSeconds,
    );
    if (result.error === 'already_rotated')
      throw new ConflictException({
        code: 'REFRESH_ALREADY_ROTATED',
        message: 'Refresh уже обновлён. Дождитесь результата другого запроса.',
      });
    if (result.error)
      throw new UnauthorizedException('Сессия недействительна. Войдите снова.');
    return this.sessionResponse(result, next, csrf);
  }
  async csrf(refresh: string, csrf: string, ip: string) {
    const known =
      refresh &&
      (await Model.knex()('authRefreshTokens')
        .where({ hash: hashSecret(refresh) })
        .first('sessionId'));
    await this.limits.consume(
      'refresh',
      ip,
      known?.sessionId ?? hashSecret(refresh ?? 'missing'),
    );
    if (!refresh || !csrf) throw new UnauthorizedException();
    const row = await Model.knex()('authRefreshTokens as t')
      .join('authSessions as s', 's.id', 't.sessionId')
      .join('users as u', 'u.id', 's.userId')
      .where({ 't.hash': hashSecret(refresh), 's.csrfHash': hashSecret(csrf) })
      .whereNull('t.usedAt')
      .whereNull('s.revokedAt')
      .where('s.expiresAt', '>', Model.knex().fn.now())
      .andWhere((qb) =>
        qb.where('s.method', 'telegram').orWhereNotNull('u.emailVerifiedAt'),
      )
      .first('s.id');
    if (!row) throw new UnauthorizedException();
    return { csrfToken: csrf };
  }
  async logout(userId: string, sessionId: string, all: boolean) {
    await this.execute('logout', userId, sessionId, all);
    return { message: 'Вы вышли из аккаунта.' };
  }
  secrets() {
    const refresh = newSecret();
    const csrf = newSecret();
    return {
      refresh,
      csrf,
      database: {
        refreshHash: hashSecret(refresh),
        csrfHash: hashSecret(csrf),
        sessionSeconds: this.settings.sessionSeconds,
      },
    };
  }
  sessionResponse(result: any, refresh: string, csrf: string) {
    const claims: AccessClaims = {
      sub: result.user.id,
      sid: result.session.id,
      typ: 'access',
    };
    const remaining = Math.floor(
      (+new Date(result.session.expiresAt) - Date.now()) / 1000,
    );
    const expiresIn = Math.min(this.settings.accessSeconds, remaining);
    return {
      body: {
        accessToken: this.jwt.sign(claims, {
          secret: this.config.get<string>('jwt.accessSecret'),
          algorithm: 'HS256',
          issuer: 'myth-zoo-verse',
          audience: 'platform',
          expiresIn,
        }),
        expiresIn,
        user: result.user,
      },
      refresh,
      csrf,
      expiresAt: result.session.expiresAt,
    };
  }
}
