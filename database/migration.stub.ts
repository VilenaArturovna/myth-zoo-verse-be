import { Knex } from 'knex';

const tableName = '';

export async function up(knex: Knex) {
  return knex.schema.createTable(tableName, (t) => {
    t.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
    t.timestamps(true, true, true);
  });
}

export async function down(knex: Knex) {
  return knex.schema.dropTable(tableName);
}
