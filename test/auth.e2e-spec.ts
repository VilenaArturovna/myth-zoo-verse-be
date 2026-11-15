import { up as telegramMigration } from '../database/migrations/core/20261029010000_telegram_oidc';
import { Test } from '@nestjs/testing';
import { INestApplication, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import * as request from 'supertest';
import knex, { Knex } from 'knex';
import { Model } from 'objection';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { AppModule } from '@src/app.module';
import { ObjectionConfigService } from '@src/common';
import {
  MailTransport,
  MemoryMailTransport,
} from '@modules/auth/mail/auth-mail.service';
import { AuthCommand, AuthUnitOfWork } from '@modules/auth/commands';
import {
  PASSWORD_OPTIONS,
  hashSecret,
  newSecret,
} from '@modules/auth/domain/auth.security';
import { ExceptionInterceptor } from '@libs/interceptors';
import { configureHttp } from '@src/common/configure-http';
import { up as extensions } from '../database/migrations/core/20251224135531_init_extensions';
import { up as users } from '../database/migrations/core/20251224135743_users';
import { up as reports } from '../database/migrations/core/20260208115108_reports';
import {
  up as authMigration,
  down as authRollback,
} from '../database/migrations/core/20261029000000_email_auth';

const ORIGIN = 'http://localhost:5173';
const PASSWORD = ' Пароль с пробелами 🌻 123 ';
const EMAIL = 'person@example.com';
describe('Platform authentication on real PostgreSQL', () => {
  let app: INestApplication;
  let db: Knex;
  let admin: Knex;
  const schema = `auth_test_${randomUUID().replace(/-/g, '')}`;
  const mail = new MemoryMailTransport();
  const post = (path: string, body: any = {}) =>
    request(app.getHttpServer()).post(path).set('Origin', ORIGIN).send(body);
  const cookies = (r: request.Response) =>
    (r.headers['set-cookie'] as unknown as string[]).map(
      (s) => s.split(';')[0],
    );
  const cookieValue = (c: string[], name: string) =>
    decodeURIComponent(
      c
        .find((s) => s.startsWith(`${name}=`))
        .split('=')
        .slice(1)
        .join('='),
    );
  const refresh = (c: string[]) =>
    post('/auth/refresh')
      .set('Cookie', c)
      .set('X-CSRF-Token', cookieValue(c, 'platform_csrf'));
  const token = () =>
    new URLSearchParams(
      new URL(
        mail.messages[mail.messages.length - 1].text.match(/https?:\/\/\S+/)[0],
      ).hash.slice(1),
    ).get('token');
  const clearLimits = () => db('authRateLimits').delete();
  async function verified(email = EMAIL) {
    await post('/auth/register', { email, password: PASSWORD }).expect(202);
    const verification = token();
    await post('/auth/verify-email', { token: verification }).expect(200);
    return { user: await db('users').where({ email }).first(), verification };
  }
  async function login(email = EMAIL) {
    const response = await post('/auth/login', {
      email,
      password: PASSWORD,
    }).expect(200);
    return {
      response,
      c: cookies(response),
      access: response.body.accessToken,
    };
  }
  const me = (access: string) =>
    request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${access}`);
  beforeAll(async () => {
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
    const userId = randomUUID(),
      codeWordId = randomUUID();
    await db('users').insert({
      id: userId,
      tgId: 123456,
      username: 'Existing',
      role: 'reviewer',
      crystals: 321,
      totalStitches: 987,
    });
    await db('codeWords').insert({
      id: codeWordId,
      word: 'цветок',
      isActive: true,
    });
    await db('reports').insert({
      userId,
      codeWordId,
      status: 'approved',
      stitchesNormalized: 987,
      stitchesRaw: { crosses: 987 },
    });
    await authMigration(db);
    expect(await db('users').where({ id: userId }).first()).toMatchObject({
      id: userId,
      tgId: '123456',
      role: 'reviewer',
      crystals: 321,
      totalStitches: 987,
      email: null,
      passwordHash: null,
    });
    expect((await db('reports').first()).userId).toBe(userId);
    // Safe reverse migration while no email-only accounts exist; forward again.
    await authRollback(db);
    await authMigration(db);
    await telegramMigration(db);
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ObjectionConfigService)
      .useValue({})
      .overrideProvider(MailTransport)
      .useValue(mail)
      .compile();
    Model.knex(db);
    app = module.createNestApplication({ logger: false, bodyParser: false });
    configureHttp(app);
    app.useGlobalInterceptors(
      new ExceptionInterceptor({
        log: () => undefined,
        error: () => undefined,
        warn: () => undefined,
      }),
    );
    await app.init();
    await app.listen(0, '127.0.0.1');
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  beforeEach(async () => {
    await db.raw(
      'TRUNCATE TABLE "authSessions", "authOneTimeTokens", "authRateLimits", reports, "codeWords", users CASCADE',
    );
    mail.messages.length = 0;
    mail.fail = false;
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    if (app) await app.close();
    if (db) await db.destroy();
    if (admin) {
      await admin.raw('DROP SCHEMA IF EXISTS ?? CASCADE', [schema]);
      await admin.destroy();
    }
  });

  it('protects existing platform endpoints without a valid session', async () => {
    await request(app.getHttpServer()).get('/').expect(401);
    await request(app.getHttpServer()).get('/reports/my').expect(401);
    await request(app.getHttpServer()).get('/me').expect(401);
  });

  it('registers normalized email, preserves Unicode password, requires confirmation and returns no secrets', async () => {
    const response = await post('/auth/register', {
      email: ' Person@Example.COM ',
      password: PASSWORD,
      role: 'admin',
      crystals: 99999,
      emailVerifiedAt: new Date(),
    }).expect(202);
    expect(response.headers['set-cookie']).toBeUndefined();
    const user = await db('users').first();
    expect(user).toMatchObject({
      email: EMAIL,
      tgId: null,
      role: 'user',
      crystals: 100,
      totalStitches: 0,
      emailVerifiedAt: null,
    });
    expect(user.passwordHash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
    expect(await argon2.verify(user.passwordHash, PASSWORD)).toBe(true);
    await post('/auth/login', { email: EMAIL, password: PASSWORD }).expect(401);
    const secret = token();
    expect((await db('authOneTimeTokens').first()).hash).toBe(
      hashSecret(secret),
    );
    await request(app.getHttpServer())
      .get(`/auth/verify-email?token=${secret}`)
      .expect(404);
    await post('/auth/verify-email', { token: secret }).expect(200);
    const session = await login();
    expect(session.response.body).toEqual({
      accessToken: expect.any(String),
      expiresIn: expect.any(Number),
      user: expect.objectContaining({ id: user.id, email: EMAIL }),
    });
    expect(JSON.stringify(session.response.body)).not.toMatch(
      /password|refreshToken|csrfHash|tgId/,
    );
    expect(
      (session.response.headers['set-cookie'] as unknown as string[]).join(' '),
    ).toContain('HttpOnly');
    expect(
      (session.response.headers['set-cookie'] as unknown as string[]).join(' '),
    ).toContain('Path=/auth');
    await me(session.access).expect(200);
    expect((await me(session.access)).body).not.toHaveProperty('passwordHash');
  });

  it('keeps original password on repeated/case-insensitive registration and PostgreSQL rejects noncanonical email', async () => {
    await verified();
    const original = (await db('users').first()).passwordHash;
    await clearLimits();
    await post('/auth/register', {
      email: EMAIL.toUpperCase(),
      password: 'another very long password',
    }).expect(202);
    expect(await db('users').count('* as count').first()).toMatchObject({
      count: '1',
    });
    expect((await db('users').first()).passwordHash).toBe(original);
    await expect(
      db('users').insert({ username: 'Duplicate', email: EMAIL, tgId: null }),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      db('users').insert({
        username: 'Uppercase',
        email: EMAIL.toUpperCase(),
        tgId: null,
      }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('concurrent registration is protected by database uniqueness, including requests in separate transactions', async () => {
    const bus = app.get(CommandBus);
    const passwordHash = await argon2.hash(PASSWORD, PASSWORD_OPTIONS);
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        bus.execute(
          new AuthCommand({
            payload: {
              action: 'register',
              args: [EMAIL, passwordHash, hashSecret(newSecret()), 86400],
            },
          }),
        ),
      ),
    );
    expect(results.every((r) => !r.isErr)).toBe(true);
    expect((await db('users').count('* as n').first()).n).toBe('1');
    expect((await db('authOneTimeTokens').count('* as n').first()).n).toBe('1');
  });

  it('rejects malformed, expired, wrong-purpose and used tokens; atomically consumes concurrent verification', async () => {
    await post('/auth/register', { email: EMAIL, password: PASSWORD }).expect(
      202,
    );
    const secret = token();
    await post('/auth/verify-email', { token: 'bad' }).expect(400);
    await post('/auth/reset-password', {
      token: secret,
      password: PASSWORD,
    }).expect(400);
    const responses = await Promise.all([
      post('/auth/verify-email', { token: secret }),
      post('/auth/verify-email', { token: secret }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 400]);
    await post('/auth/verify-email', { token: secret }).expect(400);
    await clearLimits();
    await post('/auth/forgot-password', { email: EMAIL }).expect(202);
    const reset = token();
    await db('authOneTimeTokens')
      .where({ hash: hashSecret(reset) })
      .update({ expiresAt: new Date(0) });
    await post('/auth/reset-password', {
      token: reset,
      password: PASSWORD,
    }).expect(400);
  });

  it('rejects wrong and unknown credentials with identical API response', async () => {
    await verified();
    const wrong = await post('/auth/login', {
      email: EMAIL,
      password: 'wrong long password',
    }).expect(401);
    const unknown = await post('/auth/login', {
      email: 'unknown@example.com',
      password: 'wrong long password',
    }).expect(401);
    expect(unknown.body).toEqual(wrong.body);
  });

  it('rotates refresh, preserves absolute expiry, and revokes only the replayed device family', async () => {
    await verified();
    const one = await login();
    const two = await login();
    const before = await db('authSessions').orderBy('createdAt').first();
    const rotated = await refresh(one.c).expect(200);
    const next = cookies(rotated);
    expect(cookieValue(next, 'platform_refresh')).not.toBe(
      cookieValue(one.c, 'platform_refresh'),
    );
    expect(
      (await db('authSessions').where({ id: before.id }).first()).expiresAt,
    ).toEqual(before.expiresAt);
    await db('authRefreshTokens')
      .whereNotNull('usedAt')
      .update({ usedAt: new Date(Date.now() - 6000) });
    await refresh(one.c).expect(401);
    await refresh(next).expect(401);
    await me(one.access).expect(401);
    await me(rotated.body.accessToken).expect(401);
    await me(two.access).expect(200);
    await refresh(two.c).expect(200);
  });

  it('concurrent refresh returns one success and a cookie-free conflict without revoking the winner', async () => {
    await verified();
    const session = await login();
    const results = await Promise.all([refresh(session.c), refresh(session.c)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      results.find((r) => r.status === 409).headers['set-cookie'],
    ).toBeUndefined();
    await me(results.find((r) => r.status === 200).body.accessToken).expect(
      200,
    );
  });

  it('logout and logout-all immediately revoke old access JWTs', async () => {
    await verified();
    const one = await login();
    const two = await login();
    await post('/auth/logout')
      .set('Authorization', `Bearer ${one.access}`)
      .set('Cookie', one.c)
      .set('X-CSRF-Token', cookieValue(one.c, 'platform_csrf'))
      .expect(200);
    await me(one.access).expect(401);
    await me(two.access).expect(200);
    const three = await login();
    await post('/auth/logout-all')
      .set('Authorization', `Bearer ${two.access}`)
      .set('Cookie', two.c)
      .set('X-CSRF-Token', cookieValue(two.c, 'platform_csrf'))
      .expect(200);
    await me(two.access).expect(401);
    await me(three.access).expect(401);
  });

  it('password reset consumes once, invalidates other reset tokens and all sessions without automatic login', async () => {
    await verified();
    const one = await login();
    const two = await login();
    await clearLimits();
    await post('/auth/forgot-password', { email: EMAIL }).expect(202);
    const first = token();
    await clearLimits();
    await post('/auth/forgot-password', { email: EMAIL }).expect(202);
    const second = token();
    const nextPassword = 'Новый длинный пароль 🌸';
    const results = await Promise.all([
      post('/auth/reset-password', { token: first, password: nextPassword }),
      post('/auth/reset-password', { token: first, password: nextPassword }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    expect(
      results.find((r) => r.status === 200).headers['set-cookie'],
    ).toBeUndefined();
    await post('/auth/reset-password', {
      token: second,
      password: PASSWORD,
    }).expect(400);
    await me(one.access).expect(401);
    await me(two.access).expect(401);
    await post('/auth/login', { email: EMAIL, password: PASSWORD }).expect(401);
    await post('/auth/login', { email: EMAIL, password: nextPassword }).expect(
      200,
    );
    expect(mail.messages.at(-1).subject).toBe('Пароль изменён');
    expect(mail.messages.at(-1).text).not.toContain(nextPassword);
  });

  it('rejects deleted users and expired sessions, including existing signed access JWTs', async () => {
    const { user } = await verified();
    const one = await login();
    await db('authSessions').update({ expiresAt: new Date(0) });
    await me(one.access).expect(401);
    await db('authRefreshTokens')
      .whereNotNull('usedAt')
      .update({ usedAt: new Date(Date.now() - 6000) });
    await refresh(one.c).expect(401);
    const two = await login();
    await db('users').where({ id: user.id }).delete();
    await me(two.access).expect(401);
    await refresh(two.c).expect(401);
  });

  it('enforces exact Origin, CSRF, trusted IP handling and allows CSRF bootstrap after access expiry', async () => {
    await verified();
    const one = await login();
    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(403);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(403);
    await post('/auth/refresh').set('Cookie', one.c).expect(403);
    await refresh(one.c).set('Origin', 'https://evil.example').expect(403);
    const csrf = await request(app.getHttpServer())
      .get('/auth/csrf')
      .set('Origin', ORIGIN)
      .set('Cookie', one.c)
      .expect(200);
    expect(csrf.body.csrfToken).toBe(cookieValue(one.c, 'platform_csrf'));
    await request(app.getHttpServer())
      .get('/auth/csrf')
      .set('Origin', 'https://evil.example')
      .set('Cookie', one.c)
      .expect(403);
    const keysBefore = await db('authRateLimits').count('* as n').first();
    await post('/auth/login', { email: EMAIL, password: PASSWORD })
      .set('X-Forwarded-For', '1.2.3.4')
      .expect(200);
    expect((await db('authRateLimits').count('* as n').first()).n).toBe(
      keysBefore.n,
    );
  });

  it('enforces shared rate limits and rolling mail cooldown without leaking account existence', async () => {
    const known = await post('/auth/register', {
      email: EMAIL,
      password: PASSWORD,
    }).expect(202);
    const unknown = await post('/auth/resend-verification', {
      email: 'unknown@example.com',
    }).expect(202);
    expect(unknown.body).toEqual(known.body);
    await post('/auth/resend-verification', { email: EMAIL }).expect(429);
    await db('authRateLimits')
      .where({ key: hashSecret(`mail:${EMAIL}`) })
      .update({ expiresAt: new Date(0) });
    await post('/auth/resend-verification', { email: EMAIL }).expect(202);
    await post('/auth/login', { email: EMAIL, password: PASSWORD }).expect(401);
    await db('authRateLimits').where('count', '>', 0).update({ count: 100000 });
    await post('/auth/login', { email: EMAIL, password: PASSWORD }).expect(429);
  });

  it('SMTP failure is neutral, leaves no open DB transaction and permits a later resend', async () => {
    mail.fail = true;
    const result = await post('/auth/register', {
      email: EMAIL,
      password: PASSWORD,
    }).expect(202);
    expect(result.body.message).toContain('доставка не гарантируется');
    expect(mail.messages).toHaveLength(0);
    expect(await db('users').first()).toBeTruthy();
    expect((app.get(AuthUnitOfWork) as any).transactions.size).toBe(0);
    mail.fail = false;
    await clearLimits();
    await post('/auth/resend-verification', { email: EMAIL }).expect(202);
    expect(mail.messages).toHaveLength(1);
    await post('/auth/verify-email', { token: token() }).expect(200);
  });

  it('legacy Telegram endpoint is unavailable', async () => {
    await request(app.getHttpServer())
      .patch('/user/login-via-tg')
      .set('Origin', ORIGIN)
      .send({ id: 123 })
      .expect(404);
  });

  it('rolls back all token/user changes when a write fails and refuses destructive reverse migration', async () => {
    await post('/auth/register', { email: EMAIL, password: PASSWORD }).expect(
      202,
    );
    const secret = token();
    await db.raw(
      `ALTER TABLE users ADD CONSTRAINT test_no_verification CHECK ("emailVerifiedAt" IS NULL)`,
    );
    await post('/auth/verify-email', { token: secret }).expect(500);
    expect(
      (
        await db('authOneTimeTokens')
          .where({ hash: hashSecret(secret) })
          .first()
      ).usedAt,
    ).toBeNull();
    await db.raw('ALTER TABLE users DROP CONSTRAINT test_no_verification');
    await post('/auth/verify-email', { token: secret }).expect(200);
    expect((app.get(AuthUnitOfWork) as any).transactions.size).toBe(0);
    await expect(authRollback(db)).rejects.toThrow('would lose accounts');
  });
});
