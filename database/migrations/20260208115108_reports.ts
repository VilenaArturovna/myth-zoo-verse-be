import { Knex } from 'knex';

const reports = 'reports';
const codeWords = 'codeWords';
const users = 'users';

export async function up(knex: Knex) {
  return knex.schema
    .createTable(codeWords, (t) => {
      t.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
      t.string('word').unique();
      t.boolean('isActive');
      t.timestamps(true, true, true);
    })
    .createTable(reports, (t) => {
      t.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
      t.uuid('userId').references('id').inTable(users).notNullable().index();
      t.uuid('codeWordId').references('id').inTable(codeWords).notNullable();
      t.string('status').notNullable().index();
      t.integer('stitchesNormalized').notNullable();
      t.jsonb('stitchesRaw').notNullable();
      t.string('startPhotoKey').nullable();
      t.string('finishPhotoKey').nullable();
      t.string('sagaScreenshotKey').nullable();
      t.text('userComment').nullable();
      t.text('reviewerComment').nullable();
      t.uuid('reviewerId').references('id').inTable(users).nullable();
      t.uuid('skipReviewerId').references('id').inTable(users).nullable();
      t.timestamp('reviewExpiresAt').nullable();
      t.timestamp('deleteAt').nullable().index();
      t.timestamp('approvedAt').nullable();
      t.timestamps(true, true, true);
    });
}

export async function down(knex: Knex) {
  return knex.schema.dropTable(reports).dropTable(codeWords);
}
