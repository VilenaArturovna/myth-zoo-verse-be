import { Knex } from 'knex';

export async function up(knex: Knex) {
  await knex.schema.alterTable('users', (t) => {
    t.string('email', 254).nullable();
    t.timestamp('emailVerifiedAt', { useTz: true }).nullable();
    t.text('passwordHash').nullable();
  });
  await knex.raw(
    'ALTER TABLE users ALTER COLUMN "tgId" TYPE bigint, ALTER COLUMN "tgId" DROP NOT NULL',
  );
  await knex.raw(
    `CREATE UNIQUE INDEX users_email_ci_unique ON users (lower(email COLLATE "C")) WHERE email IS NOT NULL`,
  );
  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT users_email_canonical CHECK (email IS NULL OR (email = lower(btrim(email) COLLATE "C") AND email !~ '[^ -~]'))`,
  );
  await knex.schema.createTable('authSessions', (t) => {
    t.uuid('id').primary();
    t.uuid('userId')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .index();
    t.string('method').notNullable();
    t.string('csrfHash', 64).notNullable();
    t.timestamp('expiresAt', { useTz: true }).notNullable();
    t.timestamp('revokedAt', { useTz: true }).nullable();
    t.timestamp('createdAt', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.check("method in ('email', 'telegram')");
  });
  await knex.schema.createTable('authRefreshTokens', (t) => {
    t.string('hash', 64).primary();
    t.uuid('sessionId')
      .notNullable()
      .references('id')
      .inTable('authSessions')
      .onDelete('CASCADE')
      .index();
    t.timestamp('usedAt', { useTz: true }).nullable();
    t.timestamp('createdAt', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('authOneTimeTokens', (t) => {
    t.string('hash', 64).primary();
    t.uuid('userId')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .index();
    t.string('purpose').notNullable();
    t.timestamp('expiresAt', { useTz: true }).notNullable();
    t.timestamp('usedAt', { useTz: true }).nullable();
    t.timestamp('createdAt', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.check("purpose in ('verify-email', 'reset-password')");
  });
  await knex.schema.createTable('authRateLimits', (t) => {
    t.string('key', 64).primary();
    t.integer('count').notNullable();
    t.timestamp('expiresAt', { useTz: true }).notNullable().index();
  });
  // Old Telegram JWTs deliberately cease to be accepted (they have no session ID).
  await knex('users').update({ refreshTokenHash: null });
}

export async function down(knex: Knex) {
  // A rollback cannot safely discard email-only accounts or remove their report FKs.
  const emailOnly = await knex('users').whereNull('tgId').first('id');
  const largeTg = await knex('users')
    .where('tgId', '>', 2147483647)
    .first('id');
  const credentials = await knex('users')
    .whereNotNull('email')
    .orWhereNotNull('passwordHash')
    .first('id');
  if (emailOnly || largeTg || credentials)
    throw new Error(
      'Auth rollback would lose accounts; migrate data explicitly first',
    );
  await knex.schema
    .dropTable('authRateLimits')
    .dropTable('authOneTimeTokens')
    .dropTable('authRefreshTokens')
    .dropTable('authSessions');
  await knex.raw('DROP INDEX users_email_ci_unique');
  await knex.raw('ALTER TABLE users DROP CONSTRAINT users_email_canonical');
  await knex.schema.alterTable('users', (t) => {
    t.dropColumns('email', 'emailVerifiedAt', 'passwordHash');
  });
  await knex.raw(
    'ALTER TABLE users ALTER COLUMN "tgId" TYPE integer, ALTER COLUMN "tgId" SET NOT NULL',
  );
}
