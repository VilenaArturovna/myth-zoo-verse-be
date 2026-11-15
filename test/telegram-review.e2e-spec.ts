import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import knex, { Knex } from 'knex';
import { Model } from 'objection';
import { createServer, Server } from 'http';
import { createPublicKey, generateKeyPairSync, randomUUID } from 'crypto';
import { AppModule } from '@src/app.module';
import { ObjectionConfigService } from '@src/common';
import {
  MailTransport,
  MemoryMailTransport,
} from '@modules/auth/mail/auth-mail.service';
import { AuthUnitOfWork } from '@modules/auth/commands';
import { TelegramAuthService } from '@modules/auth/telegram/telegram-auth.service';
import { TelegramTokenService } from '@modules/auth/telegram/telegram-token.service';
import { hashSecret, newSecret } from '@modules/auth/domain/auth.security';
import { configureHttp } from '@src/common/configure-http';
import { ExceptionInterceptor } from '@libs/interceptors';
import { up as extensions } from '../database/migrations/core/20251224135531_init_extensions';
import { up as users } from '../database/migrations/core/20251224135743_users';
import { up as reports } from '../database/migrations/core/20260208115108_reports';
import { up as email } from '../database/migrations/core/20261029000000_email_auth';
import { up as oidc } from '../database/migrations/core/20261029010000_telegram_oidc';

const ORIGIN = 'http://localhost:5173',
  ISSUER = 'https://oauth.telegram.org',
  CLIENT = '12345678';
const key = () =>
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
// Ephemeral independent keys, not fixtures/secrets from Telegram or production.
const a = key(),
  b = key();
const jwk = (pair: typeof a, kid: string) => ({
  ...createPublicKey(pair.publicKey).export({ format: 'jwk' }),
  kid,
  use: 'sig',
  alg: 'RS256',
});

describe('Telegram Login JS / OIDC, actual HTTP + PostgreSQL + controlled JWKS', () => {
  let app: INestApplication,
    db: Knex,
    admin: Knex,
    config: ConfigService,
    server: Server;
  let keys: any[], requests: number, failure: boolean, delay: number;
  const schema = `oidc_test_${randomUUID().replace(/-/g, '')}`;
  const http = () => request(app.getHttpServer());
  const post = (path: string, body: any = {}) =>
    http().post(path).set('Origin', ORIGIN).send(body);
  const cookies = (r: request.Response) =>
    (r.headers['set-cookie'] as unknown as string[]).map(
      (s) => s.split(';')[0],
    );
  const findCookie = (r: request.Response, name: string) =>
    cookies(r).find((s) => s.startsWith(`${name}=`));
  const me = (r: request.Response) =>
    http().get('/me').set('Authorization', `Bearer ${r.body.accessToken}`);
  const start = () => post('/auth/telegram/start').expect(200);
  const signed = (
    attempt: request.Response,
    overrides: any = {},
    pair = a,
    kid = 'a',
    alg: 'RS256' | 'HS256' = 'RS256',
  ) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: ISSUER,
      sub: 'opaque-sub-900719925474099312345',
      aud: CLIENT,
      iat: now,
      exp: now + 3600,
      nonce: attempt.body.nonce,
      id: 4503599627370495,
      preferred_username: 'test_user',
      ...overrides,
    };
    return new JwtService().sign(
      payload,
      alg === 'RS256'
        ? { privateKey: pair.privateKey, algorithm: 'RS256', keyid: kid }
        : {
            secret: 'test-only-HS256-wrong-algorithm',
            algorithm: 'HS256',
            keyid: kid,
          },
    );
  };
  const complete = (attempt: request.Response, token = signed(attempt)) =>
    post('/auth/telegram/complete', {
      attemptId: attempt.body.attemptId,
      idToken: token,
    }).set('Cookie', findCookie(attempt, 'telegram_login_attempt'));
  const login = async (overrides: any = {}) => {
    const attempt = await start();
    return complete(attempt, signed(attempt, overrides)).expect(200);
  };
  const refresh = (r: request.Response) =>
    post('/auth/refresh')
      .set(
        'Cookie',
        cookies(r).filter((s) => !s.startsWith('telegram_login_attempt=')),
      )
      .set(
        'X-CSRF-Token',
        decodeURIComponent(findCookie(r, 'platform_csrf').split('=')[1]),
      );
  const logout = (r: request.Response, all = false) =>
    post(all ? '/auth/logout-all' : '/auth/logout')
      .set(
        'Cookie',
        cookies(r).filter((s) => !s.startsWith('telegram_login_attempt=')),
      )
      .set(
        'X-CSRF-Token',
        decodeURIComponent(findCookie(r, 'platform_csrf').split('=')[1]),
      )
      .set('Authorization', `Bearer ${r.body.accessToken}`);
  beforeAll(async () => {
    server = createServer((_req, res) => {
      requests++;
      const send = () => {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = failure ? 503 : 200;
        res.end(JSON.stringify(failure ? {} : { keys }));
      };
      if (delay) setTimeout(send, delay);
      else send();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address() as any;
    process.env.TELEGRAM_JWKS_URL = `http://127.0.0.1:${address.port}/jwks`;
    admin = knex({
      client: 'pg',
      connection: process.env.AUTH_TEST_DATABASE_URL,
    });
    await admin.raw('CREATE SCHEMA ??', [schema]);
    db = knex({
      client: 'pg',
      connection: {
        connectionString: process.env.AUTH_TEST_DATABASE_URL,
        options: `-c search_path=${schema},public`,
      },
      pool: { min: 0, max: 12 },
    });
    await extensions(db);
    await users(db);
    await reports(db);
    await email(db);
    await oidc(db);
    const fixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ObjectionConfigService)
      .useValue({})
      .overrideProvider(MailTransport)
      .useValue(new MemoryMailTransport())
      .compile();
    Model.knex(db);
    app = fixture.createNestApplication({ logger: false, bodyParser: false });
    config = app.get(ConfigService);
    config.set('auth.telegram.jwksUrl', process.env.TELEGRAM_JWKS_URL);
    config.set('auth.telegram.jwksCooldownMs', 50);
    config.set('auth.telegram.jwksTimeoutMs', 100);
    configureHttp(app);
    app.useGlobalInterceptors(
      new ExceptionInterceptor({
        error: () => undefined,
        log: () => undefined,
        warn: () => undefined,
      }),
    );
    await app.init();
    await app.listen(0, '127.0.0.1');
  });
  beforeEach(async () => {
    await db.raw(
      'TRUNCATE TABLE "authLoginAttempts", "authSessions", "authOneTimeTokens", "authRateLimits", reports, "codeWords", users CASCADE',
    );
    keys = [jwk(a, 'a')];
    requests = 0;
    failure = false;
    delay = 0;
    config.set('auth.limits.telegram', 100);
    config.set('auth.telegram.jwksRequestsPerMinute', 10);
    config.set('auth.telegram.earlyStartLimit', 10000);
    config.set('auth.telegram.earlyCompleteLimit', 10000);
    await app.get(TelegramTokenService).onModuleInit();
  });
  afterAll(async () => {
    if (app) await app.close();
    if (server) {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (db) await db.destroy();
    if (admin) {
      await admin.raw('DROP SCHEMA IF EXISTS ?? CASCADE', [schema]);
      await admin.destroy();
    }
    delete process.env.TELEGRAM_JWKS_URL;
  });
  it('O01: nonce/binding hashes, signed claims and nullable Telegram-only account; no raw claims/secrets in session JSON', async () => {
    const attempt = await start();
    expect(attempt.body).toMatchObject({
      nonce: expect.any(String),
      clientId: CLIENT,
      scope: ['profile'],
    });
    expect(cookies(attempt)[0]).toContain('telegram_login_attempt=');
    expect((attempt.headers['set-cookie'] as unknown as string[])[0]).toMatch(
      /HttpOnly/,
    );
    expect((attempt.headers['set-cookie'] as unknown as string[])[0]).toContain(
      'Path=/auth/telegram',
    );
    const row = await db('authLoginAttempts').first();
    expect(row.nonceHash).toBe(hashSecret(attempt.body.nonce));
    expect(row.browserHash).toBe(
      hashSecret(findCookie(attempt, 'telegram_login_attempt').split('=')[1]),
    );
    const session = await complete(attempt).expect(200);
    await me(session).expect(200);
    expect(await db('users').first()).toMatchObject({
      tgId: '4503599627370495',
      email: null,
      emailVerifiedAt: null,
      passwordHash: null,
      role: 'user',
      totalStitches: 0,
      crystals: 100,
    });
    expect((await db('authExternalIdentities').first()).subject).toBe(
      'opaque-sub-900719925474099312345',
    );
    expect(JSON.stringify(session.body)).not.toMatch(
      /idToken|id_token|nonce|browser|Hash|refreshToken/,
    );
    expect(requests).toBe(1);
  });
  it('O02: bad signature and forbidden algorithm cannot create identities or consume verified-user quota', async () => {
    config.set('auth.limits.telegram', 1);
    const attempt = await start();
    for (let n = 0; n < 3; n++)
      await complete(attempt, signed(attempt, {}, b)).expect(401);
    await complete(attempt, signed(attempt, {}, a, 'a', 'HS256')).expect(401);
    await complete(attempt).expect(200);
    expect((await db('authSessions').count('* as n').first()).n).toBe('1');
  });
  it.each([
    ['issuer', { iss: 'https://evil.invalid' }],
    ['audience', { aud: 'other' }],
    ['multiple audiences', { aud: [CLIENT, 'other'] }],
    ['azp', { azp: 'other' }],
    ['expired', { exp: 1 }],
    ['future iat', { iat: Math.floor(Date.now() / 1000) + 1000 }],
    ['old iat', { iat: Math.floor(Date.now() / 1000) - 1000 }],
    ['fractional iat', { iat: 1.5 }],
    ['future nbf', { nbf: Math.floor(Date.now() / 1000) + 1000 }],
    ['subject type', { sub: 123 }],
    ['long subject', { sub: 's'.repeat(256) }],
    ['id type', { id: '123' }],
    ['unsafe id', { id: 9007199254740992 }],
    ['long username', { preferred_username: 'u'.repeat(256) }],
    ['subject NUL', { sub: 'invalid\0subject' }],
    ['username NUL', { preferred_username: 'invalid\0name' }],
    ['missing expiry', { exp: undefined }],
    ['missing iat', { iat: undefined }],
    ['wrong nonce', { nonce: newSecret() }],
    ['missing nonce', { nonce: undefined }],
    ['long nonce', { nonce: 'n'.repeat(256) }],
  ])('O03: rejects invalid signed claim: %s', async (_label, overrides) => {
    const attempt = await start();
    // jsonwebtoken validates registered types before signing; jose signs arbitrary test claims where needed.
    let token: string;
    if (
      [
        'subject type',
        'fractional iat',
        'missing iat',
        'missing expiry',
      ].includes(_label)
    ) {
      const jose = await app.get(TelegramTokenService)['jose'];
      const privateKey = await jose.importPKCS8(a.privateKey, 'RS256');
      const now = Math.floor(Date.now() / 1000);
      token = await new jose.SignJWT({
        iss: ISSUER,
        aud: CLIENT,
        sub: 'subject',
        exp: now + 3600,
        iat: now,
        id: 123,
        nonce: attempt.body.nonce,
        ...overrides,
      } as any)
        .setProtectedHeader({ alg: 'RS256', kid: 'a' })
        .sign(privateKey);
    } else token = signed(attempt, overrides);
    await complete(attempt, token).expect(401);
    expect(await db('users').first()).toBeUndefined();
  });
  it('O04: browser binding and token-attempt mismatch fail; no client nonce can override signed nonce', async () => {
    const one = await start(),
      two = await start();
    await complete(two, signed(one)).expect(401);
    await post('/auth/telegram/complete', {
      attemptId: one.body.attemptId,
      idToken: signed(one),
    }).expect(401);
    await complete(one)
      .set('Cookie', findCookie(two, 'telegram_login_attempt'))
      .expect(401);
    await complete(one).expect(200);
  });
  it('O05: expired attempt and sequentially superseded tab cannot finish', async () => {
    const expired = await start();
    await db('authLoginAttempts')
      .where({ id: expired.body.attemptId })
      .update({ expiresAt: new Date(0) });
    await complete(expired).expect(401);
    const one = await start();
    const two = await post('/auth/telegram/start')
      .set('Cookie', findCookie(one, 'telegram_login_attempt'))
      .expect(200);
    await complete(one).expect(401);
    await complete(two).expect(200);
  });
  it('O06: competing completion consumes once; retry does not issue/clear cookies or duplicate session', async () => {
    const attempt = await start(),
      token = signed(attempt);
    const results = await Promise.all([
      complete(attempt, token),
      complete(attempt, token),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      results.find((r) => r.status === 409).headers['set-cookie'],
    ).toBeUndefined();
    expect((await db('authSessions').count('* as n').first()).n).toBe('1');
    await complete(attempt, token).expect(409);
  });
  it('O07: repeated and six concurrent first identity logins produce one UUID and independent sessions', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 6 }, () => start()),
    );
    const results = await Promise.all(attempts.map((t) => complete(t)));
    expect(results.map((r) => r.status)).toEqual(Array(6).fill(200));
    expect(new Set(results.map((r) => r.body.user.id)).size).toBe(1);
    expect((await db('authExternalIdentities').count('* as n').first()).n).toBe(
      '1',
    );
    const next = await login({ preferred_username: 'changed' });
    expect(next.body.user.id).toBe(results[0].body.user.id);
  });
  it('O08: signed profile id links old tgId while opaque sub remains separate, preserving UUID, reports and credentials', async () => {
    const id = randomUUID(),
      word = randomUUID();
    await db('users').insert({
      id,
      tgId: '4503599627370495',
      username: 'Old',
      role: 'reviewer',
      crystals: 765,
      totalStitches: 432,
      email: 'owned@example.com',
    });
    await db('codeWords').insert({ id: word, word: 'fixture', isActive: true });
    await db('reports').insert({
      userId: id,
      codeWordId: word,
      status: 'approved',
      stitchesNormalized: 432,
      stitchesRaw: { crosses: 432 },
    });
    const before = await db('users').where({ id }).first();
    const session = await login();
    expect(session.body.user.id).toBe(id);
    expect(await db('users').where({ id }).first()).toEqual(before);
    expect((await db('reports').first()).userId).toBe(id);
    const rejected = await post('/auth/login', {
      email: 'owned@example.com',
      password: 'test long password',
    });
    expect({
      status: rejected.status,
      code: rejected.body.code,
      message:
        rejected.status >= 400 ? rejected.body.message : 'unexpected-success',
    }).toMatchObject({ status: 401 });
  });
  it('O09: conflicting subject/id/user bindings cannot merge or create partial state', async () => {
    const first = await login();
    const two = await start();
    await complete(two, signed(two, { sub: 'new-sub-same-id' })).expect(409);
    const three = await start();
    await complete(three, signed(three, { id: 123 })).expect(409);
    expect((await db('users').count('* as n').first()).n).toBe('1');
    expect((await db('authSessions').count('* as n').first()).n).toBe('1');
    await me(first).expect(200);
    await expect(
      db('authExternalIdentities').insert({
        ...(await db('authExternalIdentities').first()),
        id: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });
  it('O10: JWKS cache, rotation, unknown kid cooldown and shared fetch quota', async () => {
    await login();
    await login();
    expect(requests).toBe(1);
    const unknown = await start();
    await complete(unknown, signed(unknown, {}, b, 'unknown')).expect(401);
    expect(requests).toBe(1);
    keys = [jwk(a, 'a'), jwk(b, 'b')];
    await new Promise((r) => setTimeout(r, 80));
    const rotated = await start();
    await complete(rotated, signed(rotated, {}, b, 'b')).expect(200);
    expect(requests).toBe(2);
    config.set('auth.telegram.jwksRequestsPerMinute', 2);
    await new Promise((r) => setTimeout(r, 80));
    const limited = await start();
    await complete(limited, signed(limited, {}, b, 'another')).expect(503);
    expect(requests).toBe(2);
  });
  it('O11: JWKS outage and timeout fail closed with controlled 503', async () => {
    failure = true;
    const one = await start();
    await complete(one).expect(503);
    expect(await db('users').first()).toBeUndefined();
    failure = false;
    delay = 500;
    await app.get(TelegramTokenService).onModuleInit();
    const two = await start();
    const r = await complete(two).expect(503);
    expect(r.body.code).toBe('TELEGRAM_KEYS_UNAVAILABLE');
  });
  it('O12: early IP limiter counts malformed DTO, invalid JSON, spoofed XFF and oversized requests before validation', async () => {
    config.set('auth.telegram.earlyCompleteLimit', 3);
    await post('/auth/telegram/complete', {}).expect(400);
    await http()
      .post('/auth/telegram/complete')
      .set('Origin', ORIGIN)
      .set('Content-Type', 'application/json')
      .send('{"idToken":"secret-parser-token", INVALID}')
      .expect(400)
      .expect((r) =>
        expect(JSON.stringify(r.body)).not.toContain('secret-parser-token'),
      );
    await post('/auth/telegram/complete', {
      idToken: 'x'.repeat(20000),
    }).expect(413);
    await post('/auth/telegram/complete', {})
      .set('X-Forwarded-For', '192.0.2.1')
      .expect(429);
  });
  it('O13: legacy HMAC endpoint and Mini App-shaped payload are unavailable; Origin remains required', async () => {
    await http()
      .patch('/user/login-via-tg')
      .set('Origin', ORIGIN)
      .send({ id: 123, hash: '0'.repeat(64) })
      .expect(404);
    await post('/auth/telegram/complete', { initData: 'synthetic' }).expect(
      400,
    );
    await http().post('/auth/telegram/start').send({}).expect(403);
    await post('/auth/telegram/start')
      .set('Origin', 'https://evil.invalid')
      .expect(403);
  });
  it('O14: refresh race is a cookie-free 409, wrong CSRF cannot revoke and old replay after window revokes only that device', async () => {
    const one = await login(),
      two = await login();
    const results = await Promise.all([refresh(one), refresh(one)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const winner = results.find((r) => r.status === 200),
      duplicate = results.find((r) => r.status === 409);
    expect(duplicate.body.code).toBe('REFRESH_ALREADY_ROTATED');
    expect(duplicate.headers['set-cookie']).toBeUndefined();
    await me(winner).expect(200);
    const used = await db('authRefreshTokens').whereNotNull('usedAt').first();
    await refresh(one).expect(409);
    expect(
      (await db('authRefreshTokens').where({ hash: used.hash }).first()).usedAt,
    ).toEqual(used.usedAt);
    await db('authRefreshTokens')
      .where({ hash: used.hash })
      .update({ usedAt: new Date(Date.now() - 6000) });
    await refresh(one).set('X-CSRF-Token', newSecret()).expect(403);
    await me(winner).expect(200);
    // Matching attacker cookie/header but different server hash also cannot revoke.
    const fake = newSecret();
    await post('/auth/refresh')
      .set('Cookie', [
        findCookie(one, 'platform_refresh'),
        `platform_csrf=${fake}`,
      ])
      .set('X-CSRF-Token', fake)
      .expect(401);
    await me(winner).expect(200);
    await refresh(one).expect(401);
    await me(winner).expect(401);
    await me(two).expect(200);
  });
  it('O15: logout/current/all revoke access; pending fresh login remains permitted by explicit policy', async () => {
    const one = await login(),
      two = await login();
    await logout(one).expect(200);
    await me(one).expect(401);
    await me(two).expect(200);
    const pending = await start();
    await logout(two, true).expect(200);
    await me(two).expect(401);
    const fresh = await complete(pending).expect(200);
    await me(fresh).expect(200);
  });
  it('O16: DB failure rolls back attempt consumption, identity, user, session and refresh', async () => {
    const attempt = await start();
    await db.raw(
      'ALTER TABLE "authRefreshTokens" ADD CONSTRAINT oidc_fail_insert CHECK (false)',
    );
    try {
      await complete(attempt).expect(500);
      expect(await db('users').first()).toBeUndefined();
      expect(await db('authExternalIdentities').first()).toBeUndefined();
      expect(await db('authSessions').first()).toBeUndefined();
      expect((await db('authLoginAttempts').first()).usedAt).toBeNull();
      expect((app.get(AuthUnitOfWork) as any).transactions.size).toBe(0);
    } finally {
      await db.raw(
        'ALTER TABLE "authRefreshTokens" DROP CONSTRAINT oidc_fail_insert',
      );
    }
    await complete(attempt).expect(200);
  });
  it('O17: periodic cleanup removes expired attempts but retains session refresh replay history', async () => {
    const attempt = await start();
    const session = await login();
    await refresh(session).expect(200);
    await db('authLoginAttempts')
      .where({ id: attempt.body.attemptId })
      .update({ expiresAt: new Date(0) });
    await app.get(TelegramAuthService).cleanup();
    expect(
      await db('authLoginAttempts')
        .where({ id: attempt.body.attemptId })
        .first(),
    ).toBeUndefined();
    expect(
      await db('authRefreshTokens').whereNotNull('usedAt').first(),
    ).toBeTruthy();
  });
  it('O18: equal names do not merge email or different Telegram identities', async () => {
    await post('/auth/register', {
      email: 'test_user@example.com',
      password: 'long test password value',
    }).expect(202);
    const one = await login({
      id: 111,
      sub: 'opaque-a',
      preferred_username: 'same_name',
    });
    const two = await login({
      id: 222,
      sub: 'opaque-b',
      preferred_username: 'same_name',
    });
    expect(one.body.user.id).not.toBe(two.body.user.id);
    expect((await db('users').count('* as n').first()).n).toBe('3');
  });
  it('O19: password reset on a credentialed shared UUID revokes Telegram and email device sessions', async () => {
    const telegram = await login();
    const hash = await import('argon2').then((m) =>
      m.hash('old long test password', {
        type: m.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      }),
    );
    await db('users').where({ id: telegram.body.user.id }).update({
      email: 'linked@example.com',
      emailVerifiedAt: new Date(),
      passwordHash: hash,
    });
    const emailSession = await post('/auth/login', {
      email: 'linked@example.com',
      password: 'old long test password',
    }).expect(200);
    await post('/auth/forgot-password', { email: 'linked@example.com' }).expect(
      202,
    );
    const mail = app.get(MailTransport) as MemoryMailTransport;
    const token = new URLSearchParams(
      new URL(mail.messages.at(-1).text.match(/https?:\/\/\S+/)[0]).hash.slice(
        1,
      ),
    ).get('token');
    await post('/auth/reset-password', {
      token,
      password: 'new long test password',
    }).expect(200);
    await me(telegram).expect(401);
    await me(emailSession).expect(401);
    await refresh(telegram).expect(401);
  });
});
