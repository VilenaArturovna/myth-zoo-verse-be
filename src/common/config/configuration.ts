import * as process from 'process';
import { Config, EnvironmentTypes } from '@src/common';

export const configuration = (): Config => ({
  app: {
    env: process.env.NODE_ENV as EnvironmentTypes,
    port: parseInt(process.env.PORT),
  },
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.DB,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
});
