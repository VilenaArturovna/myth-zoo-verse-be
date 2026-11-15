import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'objection';
import { AuthSettings } from '@src/common/config/auth-configuration';
import { hashSecret } from './domain/auth.security';

@Injectable()
export class AuthRateLimitService {
  constructor(private readonly config: ConfigService) {}
  async bucket(
    name: string,
    maximum: number,
    seconds: number,
    external = false,
  ) {
    const allowed = await Model.knex().transaction(async (trx) => {
      const now: Date = (await trx.raw('select clock_timestamp() as now'))
        .rows[0].now;
      const key = hashSecret(`${name}:${Math.floor(+now / (seconds * 1000))}`);
      const [row] = await trx('authRateLimits')
        .insert({
          key,
          count: 1,
          expiresAt: new Date(
            (Math.floor(+now / (seconds * 1000)) + 1) * seconds * 1000,
          ),
        })
        .onConflict('key')
        .merge({
          count: trx.raw('LEAST("authRateLimits".count + 1, 1000000000)'),
        })
        .returning('count');
      return row.count <= maximum;
    });
    if (!allowed) {
      if (external)
        throw new ServiceUnavailableException({
          code: 'TELEGRAM_KEYS_UNAVAILABLE',
          message: 'Проверка Telegram временно недоступна',
        });
      throw new HttpException(
        { code: 'AUTH_RATE_LIMITED', message: 'Слишком много запросов' },
        429,
      );
    }
  }
  async consume(
    action: keyof AuthSettings['limits'],
    ip: string,
    target: string,
    mail = false,
  ) {
    const settings = this.config.get<AuthSettings>('auth');
    const allowed = await Model.knex().transaction(async (trx) => {
      const now: Date = (await trx.raw('select clock_timestamp() as now'))
        .rows[0].now;
      const limits = [
        {
          name: `${action}:ip:${ip}`,
          max: settings.limits[action] * 3,
          seconds: settings.limitWindowSeconds,
        },
        {
          name: `${action}:target:${target}`,
          max: settings.limits[action],
          seconds: settings.limitWindowSeconds,
        },
      ];

      let ok = true;
      // Stable ordering avoids deadlocks between overlapping IP/account buckets.
      const buckets = limits
        .map((l) => ({
          ...l,
          key: hashSecret(`${l.name}:${Math.floor(+now / (l.seconds * 1000))}`),
        }))
        .sort((a, b) => a.key.localeCompare(b.key));
      for (const bucket of buckets) {
        const rows = await trx('authRateLimits')
          .insert({
            key: bucket.key,
            count: 1,
            expiresAt: new Date(
              (Math.floor(+now / (bucket.seconds * 1000)) + 1) *
                bucket.seconds *
                1000,
            ),
          })
          .onConflict('key')
          .merge({
            count: trx.raw('LEAST("authRateLimits".count + 1, 1000000000)'),
          })
          .returning('count');
        if (rows[0].count > bucket.max) ok = false;
      }
      if (mail) {
        const cooldown = await trx('authRateLimits')
          .insert({
            key: hashSecret(`mail:${target}`),
            count: 1,
            expiresAt: new Date(+now + settings.mailCooldownSeconds * 1000),
          })
          .onConflict('key')
          .merge({
            expiresAt: new Date(+now + settings.mailCooldownSeconds * 1000),
          })
          .where('authRateLimits.expiresAt', '<=', now)
          .returning('key');
        if (!cooldown.length) ok = false;
      }
      // Bounded opportunistic cleanup: no unimplemented queue or in-memory limiter.
      await trx('authRateLimits')
        .whereIn(
          'key',
          trx('authRateLimits')
            .select('key')
            .where('expiresAt', '<', now)
            .limit(100),
        )
        .delete();
      return ok;
    });
    if (!allowed)
      throw new HttpException('Слишком много запросов. Повторите позже.', 429);
  }
}
