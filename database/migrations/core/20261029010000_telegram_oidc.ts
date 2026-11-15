import { Knex } from 'knex';
export async function up(knex: Knex) {
  await knex.schema.createTable('authLoginAttempts', (t) => {
    t.uuid('id').primary();
    t.string('nonceHash', 64).notNullable().unique();
    t.string('browserHash', 64).notNullable().index();
    t.timestamp('expiresAt', { useTz: true }).notNullable().index();
    t.timestamp('usedAt', { useTz: true }).nullable();
    t.timestamp('cancelledAt', { useTz: true }).nullable();
    t.timestamp('createdAt', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('authExternalIdentities', (t) => {
    t.uuid('id').primary();
    t.uuid('userId')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    t.string('provider', 32).notNullable();
    t.string('issuer', 255).notNullable();
    t.string('subject', 255).notNullable();
    t.bigInteger('telegramId').notNullable();
    t.timestamp('createdAt', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.unique(['provider', 'issuer', 'subject']);
    t.unique(['provider', 'issuer', 'telegramId']);
    t.unique(['provider', 'issuer', 'userId']);
  });
}
export async function down(knex: Knex) {
  if (await knex('authExternalIdentities').first('id'))
    throw new Error('External identity rollback requires explicit migration');
  await knex.schema
    .dropTable('authExternalIdentities')
    .dropTable('authLoginAttempts');
}
