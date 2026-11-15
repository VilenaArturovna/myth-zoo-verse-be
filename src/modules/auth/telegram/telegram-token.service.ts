import {
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthSettings } from '@src/common/config/auth-configuration';
import { AuthRateLimitService } from '../auth-rate-limit.service';
import { hashSecret } from '../domain/auth.security';
import { loadJose } from './jose-loader';

export const TELEGRAM_ISSUER = 'https://oauth.telegram.org';
export interface TelegramIdentity {
  subject: string;
  telegramId: string;
  nonceHash: string;
  username?: string;
  validUntil: number;
}
@Injectable()
export class TelegramTokenService implements OnModuleInit {
  private jose: Awaited<ReturnType<typeof loadJose>>;
  private keys: ReturnType<
    Awaited<ReturnType<typeof loadJose>>['createRemoteJWKSet']
  >;
  private readonly settings: AuthSettings['telegram'];
  constructor(
    config: ConfigService,
    private readonly limits: AuthRateLimitService,
  ) {
    this.settings = config.get<AuthSettings>('auth').telegram;
    const url = new URL(this.settings.jwksUrl);
    const testing = config.get<string>('app.env') === 'test';
    if (
      this.settings.jwksUrl !==
        'https://oauth.telegram.org/.well-known/jwks.json' &&
      !(
        testing &&
        url.protocol === 'http:' &&
        ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
      )
    ) {
      throw new Error(
        'Telegram JWKS must be the official HTTPS endpoint (loopback HTTP allowed only in isolated tests)',
      );
    }
  }
  async onModuleInit() {
    this.jose = await loadJose();
    this.keys = this.jose.createRemoteJWKSet(new URL(this.settings.jwksUrl), {
      timeoutDuration: this.settings.jwksTimeoutMs,
      cooldownDuration: this.settings.jwksCooldownMs,
      cacheMaxAge: this.settings.jwksCacheMs,
      [this.jose.customFetch]: async (url, options) => {
        await this.limits.bucket(
          `telegram:jwks:${this.settings.jwksUrl}`,
          this.settings.jwksRequestsPerMinute,
          60,
          true,
        );
        return fetch(url, { ...options, redirect: 'error' });
      },
    });
  }
  async verify(token: string): Promise<TelegramIdentity> {
    try {
      const { payload, protectedHeader } = await this.jose.jwtVerify(
        token,
        this.keys,
        {
          algorithms: ['RS256'],
          issuer: TELEGRAM_ISSUER,
          audience: this.settings.clientId,
          requiredClaims: ['iss', 'sub', 'aud', 'exp', 'iat', 'nonce', 'id'],
          maxTokenAge: this.settings.tokenMaxAgeSeconds,
          clockTolerance: 30,
        },
      );
      const now = Math.floor(Date.now() / 1000);
      const text = (v: unknown, max: number) =>
        typeof v === 'string' &&
        v.length > 0 &&
        v.length <= max &&
        !v.includes('\0') &&
        Buffer.from(v, 'utf8').toString('utf8') === v;
      if (
        !text(protectedHeader.kid, 128) ||
        (protectedHeader.typ !== undefined && protectedHeader.typ !== 'JWT') ||
        !text(payload.sub, 255) ||
        !/^[\x21-\x7e]+$/.test(payload.sub) ||
        payload.aud !== this.settings.clientId ||
        (payload.azp !== undefined && payload.azp !== this.settings.clientId) ||
        !Number.isSafeInteger(payload.iat) ||
        !Number.isSafeInteger(payload.exp) ||
        payload.iat > now + 30 ||
        payload.iat < now - this.settings.tokenMaxAgeSeconds ||
        payload.exp <= now ||
        payload.exp <= payload.iat ||
        payload.exp - payload.iat > 3600 ||
        (payload.nbf !== undefined &&
          (!Number.isSafeInteger(payload.nbf) || payload.nbf > now + 30)) ||
        typeof payload.nonce !== 'string' ||
        !/^[A-Za-z0-9_-]{43}$/.test(payload.nonce) ||
        typeof payload.id !== 'number' ||
        !Number.isSafeInteger(payload.id) ||
        payload.id <= 0 ||
        payload.id > 4503599627370495 ||
        (payload.preferred_username !== undefined &&
          !text(payload.preferred_username, 255))
      ) {
        throw new UnauthorizedException('Некорректный Telegram ID token');
      }
      return {
        validUntil: Math.min(
          payload.exp,
          payload.iat + this.settings.tokenMaxAgeSeconds,
        ),
        subject: payload.sub,
        telegramId: String(payload.id),
        nonceHash: hashSecret(payload.nonce),
        username: payload.preferred_username as string | undefined,
      };
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof UnauthorizedException
      )
        throw error;
      const invalidCodes = new Set([
        'ERR_JWT_EXPIRED',
        'ERR_JWT_CLAIM_VALIDATION_FAILED',
        'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
        'ERR_JOSE_ALG_NOT_ALLOWED',
        'ERR_JOSE_NOT_SUPPORTED',
        'ERR_JWS_INVALID',
        'ERR_JWT_INVALID',
        'ERR_JWKS_NO_MATCHING_KEY',
        'ERR_JWKS_MULTIPLE_MATCHING_KEYS',
      ]);
      if (invalidCodes.has(error?.code))
        throw new UnauthorizedException('Некорректный Telegram ID token');
      throw new ServiceUnavailableException({
        code: 'TELEGRAM_KEYS_UNAVAILABLE',
        message: 'Проверка Telegram временно недоступна',
      });
    }
  }
}
