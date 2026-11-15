import {
  ConflictException,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { Model } from 'objection';
import { randomUUID } from 'crypto';
import { AuthSettings } from '@src/common/config/auth-configuration';
import { AuthService } from '../auth.service';
import { AuthCommand } from '@modules/auth/commands';
import { hashSecret, newSecret } from '../domain/auth.security';
import { AuthRateLimitService } from '../auth-rate-limit.service';
import {
  TelegramTokenService,
  TELEGRAM_ISSUER,
} from './telegram-token.service';

@Injectable()
export class TelegramAuthService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval>;
  private readonly logger = new Logger(TelegramAuthService.name);
  private readonly settings: AuthSettings;
  constructor(
    config: ConfigService,
    private readonly tokens: TelegramTokenService,
    private readonly commands: CommandBus,
    private readonly auth: AuthService,
    private readonly limits: AuthRateLimitService,
  ) {
    this.settings = config.get<AuthSettings>('auth');
  }
  onModuleInit() {
    this.timer = setInterval(() => {
      void this.cleanup().catch(() =>
        this.logger.warn({ event: 'auth_attempt_cleanup_failed' }),
      );
    }, 60000);
    this.timer.unref();
  }
  onModuleDestroy() {
    clearInterval(this.timer);
  }
  async cleanup() {
    // Bounded, shared-DB cleanup; SKIP LOCKED never blocks an attempt being consumed.
    await Model.knex().transaction(async (trx) => {
      const rows = await trx('authLoginAttempts')
        .select('id')
        .where('expiresAt', '<=', trx.fn.now())
        .forUpdate()
        .skipLocked()
        .limit(500);
      if (rows.length)
        await trx('authLoginAttempts')
          .whereIn(
            'id',
            rows.map((r) => r.id),
          )
          .delete();
      const buckets = await trx('authRateLimits')
        .select('key')
        .where('expiresAt', '<=', trx.fn.now())
        .forUpdate()
        .skipLocked()
        .limit(500);
      if (buckets.length)
        await trx('authRateLimits')
          .whereIn(
            'key',
            buckets.map((r) => r.key),
          )
          .delete();
    });
  }
  async start(previousBrowser?: string) {
    const attemptId = randomUUID(),
      nonce = newSecret(),
      browser = newSecret();
    const result = (
      await this.commands.execute(
        new AuthCommand({
          payload: {
            action: 'startTelegramAttempt',
            args: [
              attemptId,
              hashSecret(nonce),
              hashSecret(browser),
              this.settings.telegram.attemptSeconds,
              previousBrowser && hashSecret(previousBrowser),
            ],
          },
        }),
      )
    ).unwrap();
    return {
      browser,
      expiresAt: result.expiresAt,
      body: {
        attemptId,
        nonce,
        clientId: this.settings.telegram.clientId,
        scope: ['profile'],
        expiresAt: result.expiresAt,
      },
    };
  }
  async complete(attemptId: string, idToken: string, browser: string) {
    if (!browser || !/^[A-Za-z0-9_-]{43}$/.test(browser))
      throw new UnauthorizedException('Попытка входа недействительна');
    const browserHash = hashSecret(browser);
    const attempt = await Model.knex()('authLoginAttempts')
      .where({ id: attemptId, browserHash })
      .whereNull('cancelledAt')
      .where('expiresAt', '>', Model.knex().fn.now())
      .first();
    if (!attempt)
      throw new UnauthorizedException('Попытка входа недействительна');
    if (attempt.usedAt)
      throw new ConflictException({
        code: 'TELEGRAM_ATTEMPT_USED',
        message: 'Попытка уже завершена',
      });
    const identity = await this.tokens.verify(idToken);
    if (identity.nonceHash !== attempt.nonceHash)
      throw new UnauthorizedException('Попытка входа недействительна');
    await this.limits.bucket(
      `telegram:identity:${TELEGRAM_ISSUER}:${identity.subject}`,
      this.settings.limits.telegram,
      this.settings.limitWindowSeconds,
    );
    const secrets = this.auth.secrets();
    const result = (
      await this.commands.execute(
        new AuthCommand({
          payload: {
            action: 'completeTelegramAttempt',
            args: [attemptId, browserHash, identity, secrets.database],
          },
        }),
      )
    ).unwrap();
    return this.auth.sessionResponse(result, secrets.refresh, secrets.csrf);
  }
}
