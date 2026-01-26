import { Knex } from 'knex';

const users = 'users';

export async function up(knex: Knex) {
  return knex.schema.createTable(users, (t) => {
    t.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    t.string('username').notNullable();
    t.text('photoUrl').nullable();
    t.string('refreshTokenHash').nullable();
    t.integer('totalStitches').notNullable().defaultTo(0);
    t.integer('crystals').notNullable().defaultTo(0);
    t.string('role').notNullable().defaultTo('user');
    t.integer('tgId').notNullable().unique();
    t.timestamps(true, true, true);
  });
}

export async function down(knex: Knex) {
  return knex.schema.dropTable(users);
}
