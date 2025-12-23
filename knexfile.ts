import { config as dotEnvConfig } from 'dotenv';
import type { Knex } from 'knex';

dotEnvConfig();

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  },
  migrations: {
    directory: 'database/migrations',
    stub: 'database/migration.stub.ts',
  },
  seeds: {
    directory: 'database/seeds',
    stub: 'database/seed.stub.ts',
  },
};

export default {
  development: config,
  production: config,
  staging: config,
};
