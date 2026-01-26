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
      database: process.env.POSTGRES_DB,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
    },
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: +process.env.JWT_ACCESS_TTL,
    refreshTtl: +process.env.JWT_REFRESH_TTL,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },
  telegram: {
    token: process.env.TG_BOT_TOKEN,
    name: process.env.TG_BOT_NAME,
  },
});
