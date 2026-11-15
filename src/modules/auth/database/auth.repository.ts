import { Model, Transaction } from 'objection';
import { randomUUID } from 'crypto';
import {
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UserEntity } from '@modules/users/domain';
import { UserOrmMapper } from '@modules/users/database/mappers';
import {
  publicProfile,
  AuthMethod,
  TokenPurpose,
} from '../domain/auth.security';

export class AuthRepository {
  constructor(private readonly trx: Transaction) {}
  private async now(): Promise<Date> {
    const result = await this.trx.raw('select clock_timestamp() as now');
    return result.rows[0].now;
  }
  async register(
    email: string,
    passwordHash: string,
    tokenHash: string,
    ttl: number,
  ) {
    const entity = UserEntity.create({ email, passwordHash });
    const values = new UserOrmMapper().toOrmEntity(entity);
    const rows = await this.trx('users')
      .insert(values)
      .onConflict()
      .ignore()
      .returning('*');
    if (!rows.length) return {};
    await this.issueToken(rows[0].id, 'verify-email', tokenHash, ttl);
    return { mail: { email, purpose: 'verify-email' as TokenPurpose } };
  }
  async issueToken(
    userId: string,
    purpose: TokenPurpose,
    hash: string,
    ttl: number,
  ) {
    const now = await this.now();
    await this.trx('authOneTimeTokens').insert({
      hash,
      userId,
      purpose,
      expiresAt: new Date(+now + ttl * 1000),
    });
  }
  async requestToken(
    email: string,
    purpose: TokenPurpose,
    hash: string,
    ttl: number,
  ) {
    const user = await this.trx('users').where({ email }).forUpdate().first();
    if (
      !user ||
      (purpose === 'verify-email' && user.emailVerifiedAt) ||
      (purpose === 'reset-password' &&
        (!user.emailVerifiedAt || !user.passwordHash))
    )
      return {};
    await this.issueToken(user.id, purpose, hash, ttl);
    return { mail: { email, purpose } };
  }
  async consumeToken(
    hash: string,
    purpose: TokenPurpose,
    passwordHash?: string,
  ) {
    // All credential/session writes lock user first, preventing reset/login/refresh deadlocks.
    const candidate = await this.trx('authOneTimeTokens')
      .where({ hash, purpose })
      .first();
    if (!candidate)
      throw new BadRequestException('Ссылка недействительна или истекла');
    const user = await this.trx('users')
      .where({ id: candidate.userId })
      .forUpdate()
      .first();
    const now = await this.now();
    const tokens = await this.trx('authOneTimeTokens')
      .where({ hash, purpose })
      .whereNull('usedAt')
      .where('expiresAt', '>', now)
      .update({ usedAt: now })
      .returning('*');
    if (!user || !tokens.length)
      throw new BadRequestException('Ссылка недействительна или истекла');
    if (purpose === 'verify-email') {
      await this.trx('users')
        .where({ id: user.id })
        .update({
          emailVerifiedAt: user.emailVerifiedAt ?? now,
          updatedAt: now,
        });
      await this.trx('authOneTimeTokens')
        .where({ userId: user.id, purpose })
        .whereNull('usedAt')
        .update({ usedAt: now });
      return {};
    }
    if (!user.emailVerifiedAt || !passwordHash)
      throw new BadRequestException('Ссылка недействительна или истекла');
    await this.trx('users')
      .where({ id: user.id })
      .update({ passwordHash, refreshTokenHash: null, updatedAt: now });
    await this.trx('authSessions')
      .where({ userId: user.id })
      .whereNull('revokedAt')
      .update({ revokedAt: now });
    await this.trx('authOneTimeTokens')
      .where({ userId: user.id, purpose })
      .whereNull('usedAt')
      .update({ usedAt: now });
    return {
      mail: { email: user.email, purpose: 'password-changed' as const },
    };
  }
  async login(userId: string, validatedHash: string, secrets: any) {
    const user = await this.trx('users')
      .where({ id: userId })
      .forUpdate()
      .first();
    if (!user || !user.emailVerifiedAt || user.passwordHash !== validatedHash)
      throw new UnauthorizedException('Неверные учётные данные');
    return this.createSession(user, 'email', secrets);
  }
  async startTelegramAttempt(
    id: string,
    nonceHash: string,
    browserHash: string,
    seconds: number,
    previousHash?: string,
  ) {
    const now = await this.now();
    if (previousHash)
      await this.trx('authLoginAttempts')
        .where({ browserHash: previousHash })
        .whereNull('usedAt')
        .update({ cancelledAt: now });
    const expiresAt = new Date(+now + seconds * 1000);
    await this.trx('authLoginAttempts').insert({
      id,
      nonceHash,
      browserHash,
      expiresAt,
    });
    return { expiresAt };
  }
  async completeTelegramAttempt(
    attemptId: string,
    browserHash: string,
    identity: {
      subject: string;
      telegramId: string;
      nonceHash: string;
      username?: string;
      validUntil: number;
    },
    secrets: any,
  ) {
    const attempt = await this.trx('authLoginAttempts')
      .where({ id: attemptId })
      .forUpdate()
      .first();
    const now = await this.now();
    if (
      identity.validUntil * 1000 <= +now ||
      !attempt ||
      attempt.browserHash !== browserHash ||
      attempt.nonceHash !== identity.nonceHash ||
      attempt.cancelledAt ||
      +new Date(attempt.expiresAt) <= +now
    )
      throw new UnauthorizedException('Попытка входа недействительна');
    if (attempt.usedAt)
      throw new ConflictException({
        code: 'TELEGRAM_ATTEMPT_USED',
        message:
          'Попытка уже завершена; проверьте сессию или начните вход заново.',
      });
    // Serialize both possible identity conflicts, without converting opaque sub to a number.
    for (const key of [
      `telegram:id:${identity.telegramId}`,
      `telegram:sub:${identity.subject}`,
    ].sort()) {
      await this.trx.raw(
        'SELECT pg_advisory_xact_lock(hashtextextended(?, 0))',
        [key],
      );
    }
    const issuer = 'https://oauth.telegram.org';
    const external = await this.trx('authExternalIdentities')
      .where({ provider: 'telegram', issuer, subject: identity.subject })
      .first();
    let user: any;
    if (external) {
      if (String(external.telegramId) !== identity.telegramId)
        throw new ConflictException('Конфликт внешней идентичности');
      user = await this.trx('users')
        .where({ id: external.userId })
        .forUpdate()
        .first();
      if (!user || String(user.tgId) !== identity.telegramId)
        throw new ConflictException('Конфликт внешней идентичности');
    } else {
      const sameId = await this.trx('authExternalIdentities')
        .where({
          provider: 'telegram',
          issuer,
          telegramId: identity.telegramId,
        })
        .first();
      if (sameId) throw new ConflictException('Конфликт внешней идентичности');
      const entity = UserEntity.create({
        tgId: identity.telegramId,
        username: identity.username,
      });
      await this.trx('users')
        .insert(new UserOrmMapper().toOrmEntity(entity))
        .onConflict('tgId')
        .ignore();
      user = await this.trx('users')
        .where({ tgId: identity.telegramId })
        .forUpdate()
        .first();
      const linked = await this.trx('authExternalIdentities')
        .where({ provider: 'telegram', issuer, userId: user.id })
        .first();
      if (linked) throw new ConflictException('Конфликт внешней идентичности');
      await this.trx('authExternalIdentities').insert({
        id: randomUUID(),
        provider: 'telegram',
        issuer,
        subject: identity.subject,
        telegramId: identity.telegramId,
        userId: user.id,
      });
    }
    await this.trx('authLoginAttempts')
      .where({ id: attemptId })
      .update({ usedAt: now });
    return this.createSession(user, 'telegram', secrets);
  }
  private async createSession(user: any, method: AuthMethod, secrets: any) {
    const now = await this.now();
    const session = {
      id: randomUUID(),
      userId: user.id,
      method,
      csrfHash: secrets.csrfHash,
      expiresAt: new Date(+now + secrets.sessionSeconds * 1000),
    };
    await this.trx('authSessions').insert(session);
    await this.trx('authRefreshTokens').insert({
      hash: secrets.refreshHash,
      sessionId: session.id,
    });
    return { user: publicProfile(user), session };
  }
  async refresh(
    hash: string,
    csrfHash: string,
    newHash: string,
    duplicateSeconds: number,
  ) {
    const candidate = await this.trx('authRefreshTokens')
      .where({ hash })
      .first();
    if (!candidate) return { error: 'unauthorized' };
    const owner = await this.trx('authSessions')
      .where({ id: candidate.sessionId })
      .first();
    if (!owner) return { error: 'unauthorized' };
    const user = await this.trx('users')
      .where({ id: owner.userId })
      .forUpdate()
      .first();
    const session = await this.trx('authSessions')
      .where({ id: owner.id })
      .forUpdate()
      .first();
    const token = await this.trx('authRefreshTokens').where({ hash }).first();
    const now = await this.now();
    if (
      !user ||
      !session ||
      session.revokedAt ||
      +new Date(session.expiresAt) <= +now ||
      (session.method === 'email' && !user.emailVerifiedAt) ||
      session.csrfHash !== csrfHash
    )
      return { error: 'unauthorized' };
    if (token.usedAt) {
      if (+now - +new Date(token.usedAt) <= duplicateSeconds * 1000)
        return { error: 'already_rotated' };
      // Return a sentinel, so revocation is COMMITTED before the HTTP 401.
      await this.trx('authSessions')
        .where({ id: session.id })
        .update({ revokedAt: now });
      return { error: 'replay' };
    }
    await this.trx('authRefreshTokens').where({ hash }).update({ usedAt: now });
    await this.trx('authRefreshTokens').insert({
      hash: newHash,
      sessionId: session.id,
    });
    return { user: publicProfile(user), session };
  }
  async logout(userId: string, sessionId: string, all: boolean) {
    await this.trx('users').where({ id: userId }).forUpdate().first();
    const qb = this.trx('authSessions')
      .where({ userId })
      .whereNull('revokedAt');
    if (!all) qb.where({ id: sessionId });
    await qb.update({ revokedAt: await this.now() });
    return {};
  }
}

export const authUserByEmail = (email: string) =>
  Model.knex()('users').where({ email }).first();
export async function activeSession(userId: string, sessionId: string) {
  return Model.knex()('authSessions as s')
    .join('users as u', 'u.id', 's.userId')
    .where({ 's.id': sessionId, 'u.id': userId })
    .whereNull('s.revokedAt')
    .where('s.expiresAt', '>', Model.knex().fn.now())
    .andWhere((qb) =>
      qb.where('s.method', 'telegram').orWhereNotNull('u.emailVerifiedAt'),
    )
    .select('u.*', 's.csrfHash')
    .first();
}
